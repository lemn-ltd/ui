import {
	type BrowserContext,
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
): Promise<void> {
	const theme = themeForProject(projectName);
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
): Promise<TPage> {
	const page = await createPage();
	try {
		await configureDeterministicPage(page, projectName);
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
): Promise<Page> {
	return createDeterministicPage(() => context.newPage(), projectName);
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

const OPERATIONAL_ROUTE_SELECTOR =
	".ui-content-layout, .showcase-embedded-preview";
const NOT_FOUND_SELECTOR = ".showcase-not-found";
const ROUTE_ERROR_SELECTOR = ".showcase-route-error";
const OBSERVED_ROUTE_SELECTOR = [
	OPERATIONAL_ROUTE_SELECTOR,
	NOT_FOUND_SELECTOR,
	ROUTE_ERROR_SELECTOR,
].join(", ");

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
		"Showcase route did not become operational.",
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
	observed: Pick<
		GotoStableFailure,
		"consoleErrors" | "failedRequests" | "httpErrors" | "pageErrors"
	>,
): Promise<GotoStableFailure> {
	try {
		const documentState = await page.evaluate(() => {
			const body = document.body?.innerText.replace(/\s+/gu, " ").trim() ?? "";
			const routeError = document.querySelector(".showcase-route-error");
			const loading = document.querySelector(".showcase-page-fallback");
			const notFound = document.querySelector(".showcase-not-found");
			const operational = document.querySelector(
				".ui-content-layout, .showcase-embedded-preview",
			);
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
		});
		return {
			...observed,
			...documentState,
			path,
			reason,
			url: page.url(),
		};
	} catch (error) {
		return {
			...observed,
			body: error instanceof Error ? error.message : String(error),
			path,
			readyState: "unavailable",
			reason,
			state: "unavailable",
			url: page.url(),
		};
	}
}

/**
 * Navigate and wait for a lazily-loaded operational route, plus fonts and two
 * render frames. Internal not-found routes require an explicit typed opt-in.
 */
export async function gotoStable(
	page: Page,
	path = "/",
	options: GotoStableOptions = {},
): Promise<void> {
	const expectedSurface = options.expectedSurface ?? "operational";
	const expectedSelector =
		expectedSurface === "not-found"
			? NOT_FOUND_SELECTOR
			: OPERATIONAL_ROUTE_SELECTOR;
	const consoleErrors: string[] = [];
	const failedRequests: string[] = [];
	const httpErrors: string[] = [];
	const pageErrors: string[] = [];
	const onConsole = (message: ConsoleMessage): void => {
		if (message.type() === "error") consoleErrors.push(message.text());
	};
	const onPageError = (error: Error): void => {
		pageErrors.push(error.message);
	};
	const onRequestFailed = (request: Request): void => {
		failedRequests.push(
			`${request.method()} ${request.url()} (${request.failure()?.errorText ?? "unknown failure"})`,
		);
	};
	const onResponse = (response: Response): void => {
		if (response.status() >= 400) {
			httpErrors.push(
				`${response.status()} ${response.request().method()} ${response.url()}`,
			);
		}
	};

	page.on("console", onConsole);
	page.on("pageerror", onPageError);
	page.on("requestfailed", onRequestFailed);
	page.on("response", onResponse);

	try {
		const navigationResponse = await page.goto(path);
		if (navigationResponse && navigationResponse.status() >= 400) {
			throw new Error(
				`navigation returned HTTP ${navigationResponse.status()} ${navigationResponse.url()}`,
			);
		}
		await page
			.locator(OBSERVED_ROUTE_SELECTOR)
			.first()
			.waitFor({ timeout: 15_000 });
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
		if (
			consoleErrors.length > 0 ||
			failedRequests.length > 0 ||
			httpErrors.length > 0 ||
			pageErrors.length > 0
		) {
			throw new Error("browser diagnostics reported route failures");
		}
	} catch (error) {
		const reason = error instanceof Error ? error.message : String(error);
		throw new Error(
			formatGotoStableFailure(
				await captureGotoStableFailure(page, path, reason, {
					consoleErrors,
					failedRequests,
					httpErrors,
					pageErrors,
				}),
			),
		);
	} finally {
		page.off("console", onConsole);
		page.off("pageerror", onPageError);
		page.off("requestfailed", onRequestFailed);
		page.off("response", onResponse);
	}
}
