import type {
	Browser,
	BrowserContext,
	BrowserContextOptions,
	Locator,
	Page,
	TestInfo,
} from "@playwright/test";
import {
	LOCAL_ADMIN_TEST_IDENTITY_HEADER,
	LOCAL_ADMIN_TEST_IDENTITY_VALUE,
} from "../../src/worker/env";
import { expect, newDeterministicPage, type Theme } from "./deterministic";

export interface AdminDeterministicPageOptions {
	readonly theme: Theme;
	readonly viewport: BrowserContextOptions["viewport"];
}

export interface AdminDeterministicPage {
	readonly context: BrowserContext;
	readonly page: Page;
}

/** Adds the explicit local-only Admin identity to an existing test page. */
export async function authorizeLocalAdminPage(page: Page): Promise<void> {
	await page.setExtraHTTPHeaders({
		[LOCAL_ADMIN_TEST_IDENTITY_HEADER]: LOCAL_ADMIN_TEST_IDENTITY_VALUE,
	});
}

/**
 * Opens an isolated deterministic browser context through the same explicit
 * local-origin identity contract used by the Worker-backed Admin tests.
 */
export async function newAdminDeterministicPage(
	browser: Browser,
	testInfo: TestInfo,
	options: AdminDeterministicPageOptions,
): Promise<AdminDeterministicPage> {
	const baseURL = testInfo.project.use.baseURL;
	if (typeof baseURL !== "string") {
		throw new Error("Admin browser tests require a Playwright baseURL.");
	}

	const context = await browser.newContext({
		baseURL,
		colorScheme: options.theme,
		extraHTTPHeaders: {
			[LOCAL_ADMIN_TEST_IDENTITY_HEADER]: LOCAL_ADMIN_TEST_IDENTITY_VALUE,
		},
		reducedMotion: "reduce",
		viewport: options.viewport,
	});

	try {
		const page = await newDeterministicPage(
			context,
			testInfo.project.name,
			options.theme,
		);
		return { context, page };
	} catch (creationError) {
		try {
			await context.close();
		} catch (cleanupError) {
			throw new AggregateError(
				[creationError, cleanupError],
				"Admin page creation and cleanup failed",
			);
		}
		throw creationError;
	}
}

/** Navigates to the protected host and waits for its compiled preview. */
export async function gotoReadyAdminBrandStudio(page: Page): Promise<Locator> {
	const response = await page.goto("/admin/brand-studio", {
		waitUntil: "domcontentloaded",
	});
	expect(response?.status()).toBe(200);
	await expect(
		page.getByRole("heading", { level: 1, name: "Brand Studio" }),
	).toBeVisible();

	const preview = page.getByRole("region", {
		name: "Live branding preview",
	});
	await expect(preview).toBeVisible();
	await expect(preview).not.toHaveAttribute("aria-busy", "true");
	await expect(preview.locator("[data-lemn-brand-scope]")).toHaveCount(1);
	await page.waitForFunction(
		() => !document.fonts || document.fonts.status === "loaded",
		undefined,
		{ timeout: 15_000 },
	);
	await page.evaluate(async () => {
		await new Promise<void>((resolve) => {
			requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
		});
	});
	return preview;
}

/** Keeps the branded specimen aligned with the deterministic Portal theme. */
export async function selectPreviewMode(
	page: Page,
	preview: Locator,
	theme: Theme,
): Promise<void> {
	await page
		.getByRole("combobox", { name: "Mode", exact: true })
		.selectOption(theme);
	await expect(
		preview.locator(`[data-lemn-brand-scope][data-lemn-mode="${theme}"]`),
	).toHaveCount(1);
}
