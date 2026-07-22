import {
	type Browser,
	type BrowserContext,
	type BrowserContextOptions,
	test as base,
	type ConsoleMessage,
	expect,
	type Page,
	type Request,
	type Response,
} from "@playwright/test";

export type Theme = "light" | "dark";

type DeterministicPage = Pick<Page, "addInitScript" | "close" | "emulateMedia">;

/** The persisted theme key the package theme runtime reads on first mount. */
const THEME_STORAGE_KEY = "color-theme";

function themeForProject(name: string): Theme {
	return name.includes("dark") ? "dark" : "light";
}

async function configureDeterministicPage(
	page: DeterministicPage,
	projectName: string,
	themeOverride?: Theme,
): Promise<void> {
	const theme = themeOverride ?? themeForProject(projectName);
	await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" });
	await page.addInitScript(
		([key, value]) => {
			try {
				window.localStorage.setItem(key, value);
			} catch {
				// Storage can be unavailable in some contexts; the app falls back to light.
			}
		},
		[THEME_STORAGE_KEY, theme] as const,
	);
}

export async function createDeterministicPage<TPage extends DeterministicPage>(
	createPage: () => Promise<TPage>,
	projectName: string,
	themeOverride?: Theme,
): Promise<TPage> {
	const page = await createPage();
	try {
		await configureDeterministicPage(page, projectName, themeOverride);
		return page;
	} catch (configurationError) {
		try {
			await page.close();
		} catch (cleanupError) {
			throw new AggregateError(
				[configurationError, cleanupError],
				"Deterministic page configuration and cleanup failed",
			);
		}
		throw configurationError;
	}
}

export async function newDeterministicPage(
	context: BrowserContext,
	projectName: string,
	themeOverride?: Theme,
): Promise<Page> {
	return createDeterministicPage(
		() => context.newPage(),
		projectName,
		themeOverride,
	);
}

export interface IsolatedDeterministicPage {
	readonly context: BrowserContext;
	readonly page: Page;
}

export interface IsolatedDeterministicPageOptions {
	readonly baseURL: string;
	readonly projectName: string;
	readonly theme: Theme;
	readonly viewport?: BrowserContextOptions["viewport"];
}

export async function newIsolatedDeterministicPage(
	browser: Browser,
	options: IsolatedDeterministicPageOptions,
): Promise<IsolatedDeterministicPage> {
	const context = await browser.newContext({
		baseURL: options.baseURL,
		colorScheme: options.theme,
		reducedMotion: "reduce",
		viewport: options.viewport,
	});
	try {
		const page = await newDeterministicPage(
			context,
			options.projectName,
			options.theme,
		);
		return { context, page };
	} catch (creationError) {
		try {
			await context.close();
		} catch (cleanupError) {
			throw new AggregateError(
				[creationError, cleanupError],
				"Isolated deterministic page creation and cleanup failed",
			);
		}
		throw creationError;
	}
}

/**
 * Deterministic test base: every page boots in its project's theme, with reduced
 * motion forced so shimmer/spin/indeterminate loops are static and visual
 * baselines stay byte-stable. Theme is derived from the project name
 * (`behavior` and `visual-light-*` → light; `visual-dark-*` → dark).
 */
export const test = base.extend({
	page: async ({ page }, use, testInfo) => {
		await configureDeterministicPage(page, testInfo.project.name);
		await use(page);
	},
});

export { expect };

const PAGE_FALLBACK_SELECTOR = ".portal-page-fallback";
const OPERATIONAL_ROUTE_SELECTOR = [
	".ui-content-layout",
	`.portal-embedded-preview > :not(${PAGE_FALLBACK_SELECTOR}):not(.portal-route-error)`,
].join(", ");
const NOT_FOUND_SELECTOR = ".portal-not-found";
const ROUTE_ERROR_SELECTOR = ".portal-route-error";

// Covers delayed browser failures scheduled 500 ms after operational DOM.
const POST_READY_DIAGNOSTIC_QUIET_MS = 750;
const DIAGNOSTIC_FAILURE_DRAIN_QUIET_MS = 50;
const DIAGNOSTIC_FAILURE_DRAIN_MAX_MS = 250;

interface DiagnosticWindow {
	readonly token: symbol;
}

interface PageDiagnostics {
	activeWindow?: symbol;
	activityRevision: number;
	readonly consoleErrors: string[];
	disposed: boolean;
	readonly failedRequests: string[];
	readonly httpErrors: string[];
	navigationInProgress: boolean;
	readonly pageErrors: string[];
	readonly waiters: Set<() => void>;
}

const pageDiagnostics = new WeakMap<Page, PageDiagnostics>();

export interface RouteDiagnosticLifecycle {
	readonly activeWindowCount: 0 | 1;
	readonly listenerSetCount: 0 | 1;
	readonly pendingWaiterCount: number;
	readonly retainedFailureCount: number;
}

export function routeDiagnosticLifecycle(page: Page): RouteDiagnosticLifecycle {
	const diagnostics = pageDiagnostics.get(page);
	if (!diagnostics) {
		return {
			activeWindowCount: 0,
			listenerSetCount: 0,
			pendingWaiterCount: 0,
			retainedFailureCount: 0,
		};
	}
	return {
		activeWindowCount: diagnostics.activeWindow ? 1 : 0,
		listenerSetCount: diagnostics.disposed ? 0 : 1,
		pendingWaiterCount: diagnostics.waiters.size,
		retainedFailureCount:
			diagnostics.consoleErrors.length +
			diagnostics.failedRequests.length +
			diagnostics.httpErrors.length +
			diagnostics.pageErrors.length,
	};
}

function hasDiagnosticFailures(
	observed: Pick<
		GotoStableFailure,
		"consoleErrors" | "failedRequests" | "httpErrors" | "pageErrors"
	>,
): boolean {
	return (
		observed.consoleErrors.length > 0 ||
		observed.failedRequests.length > 0 ||
		observed.httpErrors.length > 0 ||
		observed.pageErrors.length > 0
	);
}

function signalDiagnosticActivity(diagnostics: PageDiagnostics): void {
	diagnostics.activityRevision += 1;
	for (const wake of [...diagnostics.waiters]) wake();
}

function diagnosticsFor(page: Page): PageDiagnostics {
	const existing = pageDiagnostics.get(page);
	if (existing) return existing;

	const diagnostics: PageDiagnostics = {
		activityRevision: 0,
		consoleErrors: [],
		disposed: false,
		failedRequests: [],
		httpErrors: [],
		navigationInProgress: false,
		pageErrors: [],
		waiters: new Set(),
	};
	const onConsole = (message: ConsoleMessage): void => {
		if (message.type() !== "error") return;
		diagnostics.consoleErrors.push(message.text());
		signalDiagnosticActivity(diagnostics);
	};
	const onPageError = (error: Error): void => {
		diagnostics.pageErrors.push(error.message);
		signalDiagnosticActivity(diagnostics);
	};
	const onRequestFailed = (request: Request): void => {
		const failure = request.failure()?.errorText ?? "unknown failure";
		// A new document navigation legitimately cancels lazy subresources owned by
		// the document being left. Keep every other transport failure observable.
		if (
			diagnostics.navigationInProgress &&
			failure === "net::ERR_ABORTED" &&
			!request.isNavigationRequest()
		) {
			return;
		}
		diagnostics.failedRequests.push(
			`${request.method()} ${request.url()} (${failure})`,
		);
		signalDiagnosticActivity(diagnostics);
	};
	const onResponse = (response: Response): void => {
		if (response.status() < 400) return;
		diagnostics.httpErrors.push(
			`${response.status()} ${response.request().method()} ${response.url()}`,
		);
		signalDiagnosticActivity(diagnostics);
	};
	const onClose = (): void => {
		if (diagnostics.disposed) return;
		diagnostics.disposed = true;
		page.off("console", onConsole);
		page.off("pageerror", onPageError);
		page.off("requestfailed", onRequestFailed);
		page.off("response", onResponse);
		page.off("close", onClose);
		signalDiagnosticActivity(diagnostics);
		diagnostics.consoleErrors.length = 0;
		diagnostics.failedRequests.length = 0;
		diagnostics.httpErrors.length = 0;
		diagnostics.pageErrors.length = 0;
	};

	page.on("console", onConsole);
	page.on("pageerror", onPageError);
	page.on("requestfailed", onRequestFailed);
	page.on("response", onResponse);
	page.on("close", onClose);
	pageDiagnostics.set(page, diagnostics);
	return diagnostics;
}

function beginDiagnosticWindow(diagnostics: PageDiagnostics): DiagnosticWindow {
	if (diagnostics.disposed) {
		throw new Error("cannot navigate a closed deterministic page");
	}
	if (diagnostics.activeWindow) {
		throw new Error(
			"deterministic navigation already owns this page diagnostics lifecycle",
		);
	}
	const token = Symbol("deterministic route diagnostics");
	diagnostics.activeWindow = token;
	return { token };
}

function observedDiagnostics(
	diagnostics: PageDiagnostics,
): Pick<
	GotoStableFailure,
	"consoleErrors" | "failedRequests" | "httpErrors" | "pageErrors"
> {
	return {
		consoleErrors: [...diagnostics.consoleErrors],
		failedRequests: [...diagnostics.failedRequests],
		httpErrors: [...diagnostics.httpErrors],
		pageErrors: [...diagnostics.pageErrors],
	};
}

function finishDiagnosticWindow(
	diagnostics: PageDiagnostics,
	window: DiagnosticWindow,
): void {
	if (diagnostics.activeWindow !== window.token) return;
	diagnostics.consoleErrors.length = 0;
	diagnostics.failedRequests.length = 0;
	diagnostics.httpErrors.length = 0;
	diagnostics.pageErrors.length = 0;
	diagnostics.activeWindow = undefined;
}

async function waitForDiagnosticActivity(
	diagnostics: PageDiagnostics,
	revision: number,
	timeoutMs: number,
): Promise<"activity" | "timeout"> {
	if (diagnostics.activityRevision !== revision || diagnostics.disposed) {
		return "activity";
	}
	return new Promise((resolve) => {
		let settled = false;
		const finish = (result: "activity" | "timeout"): void => {
			if (settled) return;
			settled = true;
			clearTimeout(timer);
			diagnostics.waiters.delete(onActivity);
			resolve(result);
		};
		const onActivity = (): void => finish("activity");
		const timer = setTimeout(() => finish("timeout"), timeoutMs);
		diagnostics.waiters.add(onActivity);
		if (diagnostics.activityRevision !== revision || diagnostics.disposed) {
			finish("activity");
		}
	});
}

async function waitForPostReadyDiagnosticQuiet(
	diagnostics: PageDiagnostics,
): Promise<void> {
	if (!hasDiagnosticFailures(observedDiagnostics(diagnostics))) {
		await waitForDiagnosticActivity(
			diagnostics,
			diagnostics.activityRevision,
			POST_READY_DIAGNOSTIC_QUIET_MS,
		);
	}
	if (!hasDiagnosticFailures(observedDiagnostics(diagnostics))) return;

	const startedAt = Date.now();
	let revision = diagnostics.activityRevision;
	while (!diagnostics.disposed) {
		const boundedRemaining =
			DIAGNOSTIC_FAILURE_DRAIN_MAX_MS - (Date.now() - startedAt);
		if (boundedRemaining <= 0) return;
		const result = await waitForDiagnosticActivity(
			diagnostics,
			revision,
			Math.min(DIAGNOSTIC_FAILURE_DRAIN_QUIET_MS, boundedRemaining),
		);
		if (result === "timeout") return;
		revision = diagnostics.activityRevision;
	}
}

export interface GotoStableOptions {
	readonly expectedSurface?: "not-found" | "operational";
}

export interface GotoStableFailure {
	readonly body: string;
	readonly consoleErrors: readonly string[];
	readonly failedRequests: readonly string[];
	readonly httpErrors: readonly string[];
	readonly pageErrors: readonly string[];
	readonly path: string;
	readonly readyState: string;
	readonly reason: string;
	readonly state:
		| "blank"
		| "error"
		| "loading"
		| "not-found"
		| "non-operational"
		| "operational"
		| "unavailable";
	readonly url: string;
}

function limited(values: readonly string[]): string {
	return JSON.stringify([...new Set(values)].slice(0, 5));
}

export function formatGotoStableFailure(failure: GotoStableFailure): string {
	return [
		"Portal route did not become operational.",
		`path=${JSON.stringify(failure.path)}`,
		`url=${JSON.stringify(failure.url)}`,
		`state=${failure.state}`,
		`readyState=${failure.readyState}`,
		`reason=${JSON.stringify(failure.reason)}`,
		`pageErrors=${limited(failure.pageErrors)}`,
		`consoleErrors=${limited(failure.consoleErrors)}`,
		`failedRequests=${limited(failure.failedRequests)}`,
		`httpErrors=${limited(failure.httpErrors)}`,
		`body=${JSON.stringify(failure.body)}`,
	].join("\n");
}

async function captureGotoStableFailure(
	page: Page,
	path: string,
	reason: string,
	observed: () => Pick<
		GotoStableFailure,
		"consoleErrors" | "failedRequests" | "httpErrors" | "pageErrors"
	>,
): Promise<GotoStableFailure> {
	try {
		const documentState = await page.evaluate((operationalSelector) => {
			const body = document.body?.innerText.replace(/\s+/gu, " ").trim() ?? "";
			const routeError = document.querySelector(".portal-route-error");
			const loading = document.querySelector(".portal-page-fallback");
			const notFound = document.querySelector(".portal-not-found");
			const operational = document.querySelector(operationalSelector);
			const root = document.querySelector("#root");
			const state: GotoStableFailure["state"] = routeError
				? "error"
				: loading
					? "loading"
					: notFound
						? "not-found"
						: operational
							? "operational"
							: !root?.hasChildNodes()
								? "blank"
								: "non-operational";
			return {
				body: body.slice(0, 500),
				readyState: document.readyState,
				state,
			};
		}, OPERATIONAL_ROUTE_SELECTOR);
		return {
			...observed(),
			...documentState,
			path,
			reason,
			url: page.url(),
		};
	} catch (error) {
		return {
			...observed(),
			body: error instanceof Error ? error.message : String(error),
			path,
			readyState: "unavailable",
			reason,
			state: "unavailable",
			url: page.url(),
		};
	}
}

async function gotoPortalRoute(
	page: Page,
	path: string,
	options: GotoStableOptions,
	waitForPostReadyDiagnostics: boolean,
): Promise<void> {
	const expectedSurface = options.expectedSurface ?? "operational";
	const expectedSelector =
		expectedSurface === "not-found"
			? NOT_FOUND_SELECTOR
			: OPERATIONAL_ROUTE_SELECTOR;
	const diagnostics = diagnosticsFor(page);
	const diagnosticWindow = beginDiagnosticWindow(diagnostics);

	try {
		diagnostics.navigationInProgress = true;
		const navigationResponse = await page.goto(path).finally(() => {
			diagnostics.navigationInProgress = false;
		});
		if (navigationResponse && navigationResponse.status() >= 400) {
			throw new Error(
				`navigation returned HTTP ${navigationResponse.status()} ${navigationResponse.url()}`,
			);
		}
		await page.waitForFunction(
			({ fallback, notFound, operational, routeError }) => {
				if (document.querySelector(routeError)) return true;
				if (document.querySelector(notFound)) return true;
				return (
					document.querySelector(fallback) === null &&
					document.querySelector(operational) !== null
				);
			},
			{
				fallback: PAGE_FALLBACK_SELECTOR,
				notFound: NOT_FOUND_SELECTOR,
				operational: OPERATIONAL_ROUTE_SELECTOR,
				routeError: ROUTE_ERROR_SELECTOR,
			},
			{ timeout: 15_000 },
		);
		if (await page.locator(ROUTE_ERROR_SELECTOR).first().isVisible()) {
			throw new Error("route error surface rendered");
		}
		const notFoundVisible = await page
			.locator(NOT_FOUND_SELECTOR)
			.first()
			.isVisible();
		if (notFoundVisible && expectedSurface !== "not-found") {
			throw new Error(
				`expected ${expectedSurface} surface but rendered not-found`,
			);
		}
		if (await page.locator(PAGE_FALLBACK_SELECTOR).first().isVisible()) {
			throw new Error("route remained on its loading surface");
		}
		if (!(await page.locator(expectedSelector).first().isVisible())) {
			throw new Error(
				notFoundVisible
					? `expected ${expectedSurface} surface but rendered not-found`
					: `expected ${expectedSurface} surface did not render`,
			);
		}
		await page.evaluate(async () => {
			await document.fonts?.ready;
			await new Promise<void>((resolve) => {
				requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
			});
		});
		if (waitForPostReadyDiagnostics) {
			await waitForPostReadyDiagnosticQuiet(diagnostics);
		}
		if (diagnostics.disposed) return;
		if (hasDiagnosticFailures(observedDiagnostics(diagnostics))) {
			throw new Error("browser diagnostics reported route failures");
		}
	} catch (error) {
		const reason = error instanceof Error ? error.message : String(error);
		throw new Error(
			formatGotoStableFailure(
				await captureGotoStableFailure(page, path, reason, () =>
					observedDiagnostics(diagnostics),
				),
			),
		);
	} finally {
		diagnostics.navigationInProgress = false;
		finishDiagnosticWindow(diagnostics, diagnosticWindow);
	}
}

/**
 * Navigate and wait for a lazily-loaded operational route, fonts, render
 * frames, and a bounded post-ready diagnostics quiet period. Page listeners
 * remain installed until close so delayed work cannot escape between routes.
 * Internal not-found routes require an explicit typed opt-in.
 *
 * Use this strict boundary once per public route. Focused suites that perform
 * substantial assertions after readiness can use `gotoReady` to avoid paying
 * the same 750 ms diagnostic window repeatedly for the same route.
 */
export async function gotoStable(
	page: Page,
	path = "/",
	options: GotoStableOptions = {},
): Promise<void> {
	return gotoPortalRoute(page, path, options, true);
}

/**
 * Navigate through the same operational/readiness and immediate-diagnostics
 * contract as `gotoStable`, without duplicating its post-ready quiet period.
 * This is reserved for focused suites after the route has strict crawl
 * coverage elsewhere.
 */
export async function gotoReady(
	page: Page,
	path = "/",
	options: GotoStableOptions = {},
): Promise<void> {
	return gotoPortalRoute(page, path, options, false);
}
