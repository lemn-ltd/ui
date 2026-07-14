import {
	type BrowserContext,
	test as base,
	expect,
	type Page,
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

/**
 * Navigate and wait for the lazily-loaded page to resolve (its ContentLayout or
 * the not-found surface), plus fonts, so assertions and screenshots are stable.
 */
export async function gotoStable(page: Page, path = "/"): Promise<void> {
	await page.goto(path);
	await page
		.locator(
			".ui-content-layout, .showcase-not-found, .showcase-embedded-preview",
		)
		.first()
		.waitFor({ timeout: 15_000 });
	await page.evaluate(async () => {
		await document.fonts?.ready;
	});
}
