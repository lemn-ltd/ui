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

/** The persisted theme key the package theme runtime reads on first mount. */
const THEME_STORAGE_KEY = "color-theme";

function themeForProject(name: string): Theme {
	return name.includes("dark") ? "dark" : "light";
}

async function configureDeterministicPage(
	page: Page,
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

export async function newDeterministicPage(
	context: BrowserContext,
	projectName: string,
): Promise<Page> {
	const page = await context.newPage();
	await configureDeterministicPage(page, projectName);
	return page;
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
	".ui-content-layout, .showcase-not-found, .showcase-embedded-preview";
const ROUTE_ERROR_SELECTOR = ".showcase-route-error";

export interface GotoStableFailure {
	readonly body: string;
	readonly consoleErrors: readonly string[];
	readonly failedRequests: readonly string[];
	readonly httpErrors: readonly string[];
	readonly pageErrors: readonly string[];
	readonly path: string;
	readonly readyState: string;
	readonly state:
		| "blank"
		| "error"
		| "loading"
		| "non-operational"
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
			const root = document.querySelector("#root");
			const state: GotoStableFailure["state"] = routeError
				? "error"
				: loading
					? "loading"
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
			url: page.url(),
		};
	} catch (error) {
		return {
			...observed,
			body: error instanceof Error ? error.message : String(error),
			path,
			readyState: "unavailable",
			state: "unavailable",
			url: page.url(),
		};
	}
}

/**
 * Navigate and wait for the lazily-loaded page to resolve (its ContentLayout or
 * the not-found surface), plus fonts, so assertions and screenshots are stable.
 */
export async function gotoStable(page: Page, path = "/"): Promise<void> {
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
		await page.goto(path);
		await page
			.locator(`${OPERATIONAL_ROUTE_SELECTOR}, ${ROUTE_ERROR_SELECTOR}`)
			.first()
			.waitFor({ timeout: 15_000 });
		if (await page.locator(ROUTE_ERROR_SELECTOR).first().isVisible()) {
			throw new Error("route error surface rendered");
		}
		await page.evaluate(async () => {
			await document.fonts?.ready;
		});
	} catch {
		throw new Error(
			formatGotoStableFailure(
				await captureGotoStableFailure(page, path, {
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
