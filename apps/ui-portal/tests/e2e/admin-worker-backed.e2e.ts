import type { Browser, BrowserContext, Page, TestInfo } from "@playwright/test";
import type { AdminSession } from "../../src/client/modules/admin/api";
import {
	LOCAL_ADMIN_TEST_IDENTITY_HEADER,
	LOCAL_ADMIN_TEST_IDENTITY_VALUE,
} from "../../src/worker/env";
import { expect, test } from "../helpers/deterministic";

const ADMIN_ROUTES = [
	["/admin", "Overview"],
	["/admin/registry", "Registry"],
	["/admin/conformance", "Conformance"],
	["/admin/brand-studio", "Brand Studio"],
	["/admin/releases", "Releases"],
	["/admin/settings", "Settings"],
] as const;

async function adminContext(
	browser: Browser,
	testInfo: TestInfo,
): Promise<BrowserContext> {
	const baseURL = testInfo.project.use.baseURL;
	if (typeof baseURL !== "string") {
		throw new Error("Worker-backed Admin tests require a Playwright baseURL.");
	}
	return browser.newContext({
		baseURL,
		colorScheme: "light",
		extraHTTPHeaders: {
			[LOCAL_ADMIN_TEST_IDENTITY_HEADER]: LOCAL_ADMIN_TEST_IDENTITY_VALUE,
		},
		reducedMotion: "reduce",
		viewport: { width: 1280, height: 900 },
	});
}

async function gotoAdmin(
	page: Page,
	path: string,
	title: string,
): Promise<void> {
	const navigation = page.getByRole("navigation", { name: "Admin sections" });
	if (await navigation.isVisible()) {
		await navigation.getByRole("link", { name: title, exact: true }).click();
	} else {
		const response = await page.goto(path, { waitUntil: "domcontentloaded" });
		expect(response?.status()).toBe(200);
	}
	await expect(
		page.getByRole("heading", { level: 1, name: title }),
	).toBeVisible();
	expect(new URL(page.url()).pathname).toBe(path);
}

test("the Worker authenticates normalized local identity across all six Admin routes and protects its chunks", async ({
	browser,
}, testInfo) => {
	const baseURL = testInfo.project.use.baseURL;
	if (typeof baseURL !== "string") throw new Error("Missing baseURL");

	const anonymous = await browser.newContext({ baseURL });
	try {
		const denied = await anonymous.request.get("/admin");
		expect(denied.status()).toBe(401);
		expect(denied.headers()["content-type"]).toContain(
			"application/problem+json",
		);
		expect(await denied.json()).toMatchObject({
			code: "access-required",
			requestId: expect.stringMatching(/^[0-9a-f-]{36}$/u),
		});
	} finally {
		await anonymous.close();
	}

	const context = await adminContext(browser, testInfo);
	const page = await context.newPage();
	const protectedChunks = new Set<string>();
	page.on("response", (response) => {
		const pathname = new URL(response.url()).pathname;
		if (pathname.startsWith("/admin-assets/")) protectedChunks.add(pathname);
	});
	try {
		for (const [path, title] of ADMIN_ROUTES) {
			await gotoAdmin(page, path, title);
		}

		const session = await page.evaluate(async () => {
			const response = await fetch("/api/admin/session");
			return {
				body: (await response.json()) as AdminSession,
				responseRequestId: response.headers.get("x-request-id"),
			};
		});
		expect(session.body).toMatchObject({
			identity: {
				kind: "human",
				email: "local-development@ui.le-mn.com",
				role: "portal-admin",
			},
			capabilities: ["portal-admin"],
		});
		expect(session.body.requestId).toMatch(/^[0-9a-f-]{36}$/u);
		expect(session.responseRequestId).toBe(session.body.requestId);
		expect(JSON.stringify(session)).not.toMatch(/assertion|subject|token/iu);
		expect(protectedChunks.size).toBeGreaterThan(0);

		await expect(
			page.getByText("ASSETS binding", { exact: true }),
		).toBeVisible();
		await expect(
			page.getByText("https://••••.cloudflareaccess.com", { exact: true }),
		).toBeVisible();
		await expect(
			page.getByText("••••aaaaaa · 1", { exact: true }),
		).toBeVisible();
		await expect(
			page.getByText("••••bbbbbb · 1", { exact: true }),
		).toBeVisible();
		await expect(page.getByText("Not configured", { exact: true })).toHaveCount(
			0,
		);
		await expect(
			page.getByText("browser-local", { exact: true }),
		).toBeVisible();

		const firstChunk = [...protectedChunks][0];
		expect(firstChunk).toBeDefined();
		const anonymousChunk = await browser.newContext({ baseURL });
		try {
			const deniedChunk = await anonymousChunk.request.get(firstChunk ?? "");
			expect(deniedChunk.status()).toBe(401);
			expect(await deniedChunk.json()).toMatchObject({
				code: "access-required",
			});
		} finally {
			await anonymousChunk.close();
		}
	} finally {
		await context.close();
	}
});

test("route-owned Admin reads expose loading, error, retry, and empty states without leaking Registry failures", async ({
	browser,
}, testInfo) => {
	const context = await adminContext(browser, testInfo);
	const page = await context.newPage();
	let registryRequests = 0;
	await page.route("**/api/admin/registry", async (route) => {
		registryRequests += 1;
		if (registryRequests === 1) {
			await route.fulfill({
				contentType: "application/problem+json",
				json: {
					type: "https://portal.ui.le-mn.com/problems/local-e2e-failure",
					title: "Local E2E failure",
					status: 503,
					detail: "The local Registry read is temporarily unavailable.",
					code: "local-e2e-failure",
					requestId: "11111111-1111-4111-8111-111111111111",
				},
				status: 503,
			});
			return;
		}
		await route.continue();
	});

	try {
		await gotoAdmin(page, "/admin", "Overview");
		expect(registryRequests).toBe(0);
		await expect(page.getByText("Admin data unavailable")).toHaveCount(0);

		await gotoAdmin(page, "/admin/brand-studio", "Brand Studio");
		expect(registryRequests).toBe(0);
		await expect(page.getByText("Admin data unavailable")).toHaveCount(0);

		await gotoAdmin(page, "/admin/registry", "Registry");
		await expect(page.getByText("Admin data unavailable")).toBeVisible();
		await expect(
			page.getByText("11111111-1111-4111-8111-111111111111"),
		).toBeVisible();
		await page.getByRole("button", { name: "Retry" }).click();
		await expect(
			page.getByRole("heading", { name: "Provider mappings" }),
		).toBeVisible();
		expect(registryRequests).toBe(2);

		await page.unroute("**/api/admin/registry");
		await page.route("**/api/admin/registry", async (route) => {
			const response = await route.fetch();
			const body = (await response.json()) as Record<string, unknown>;
			await route.fulfill({ response, json: { ...body, capabilities: [] } });
		});
		await gotoAdmin(page, "/admin", "Overview");
		await gotoAdmin(page, "/admin/registry", "Registry");
		await expect(
			page.getByText("No provider mappings", { exact: true }),
		).toBeVisible();
		await page.unroute("**/api/admin/registry");

		await page.route("**/api/admin/settings", async (route) => {
			await new Promise((resolve) => setTimeout(resolve, 500));
			await route.continue();
		});
		await page.getByRole("link", { name: "Settings" }).click();
		await expect(
			page.getByText("Loading effective masked configuration…"),
		).toBeVisible();
		await expect(
			page.getByRole("heading", { name: "Settings", level: 2 }),
		).toBeVisible();
	} finally {
		await context.close();
	}
});

test("the real proposal endpoint exposes pending, success, and conflict without mutating Registry", async ({
	browser,
}, testInfo) => {
	const context = await adminContext(browser, testInfo);
	const page = await context.newPage();
	try {
		await gotoAdmin(page, "/admin/registry", "Registry");
		const registry = (await page.evaluate(async () => {
			const response = await fetch("/api/admin/registry");
			return response.json();
		})) as {
			capabilities: readonly { capabilityId: string; maturity: string }[];
		};
		const target = registry.capabilities[0];
		if (!target) throw new Error("The Registry has no proposal target.");

		await page
			.getByLabel("Proposal capability")
			.selectOption(target.capabilityId);
		await page
			.getByLabel("Requested maturity")
			.selectOption(target.maturity === "beta" ? "stable" : "beta");
		await page.route("**/api/admin/registry/proposals", async (route) => {
			await new Promise((resolve) => setTimeout(resolve, 250));
			await route.continue();
		});
		await page
			.getByRole("button", { name: "Generate proposal bundle" })
			.click();
		await expect(
			page.getByRole("button", { name: "Generating…" }),
		).toBeDisabled();
		await expect(page.getByText("Non-mutating proposal bundle")).toBeVisible();
		await expect(page.locator(".admin-json pre")).toContainText(
			'"activeManifestMutated": false',
		);

		await page.unroute("**/api/admin/registry/proposals");
		await page.getByLabel("Requested maturity").selectOption(target.maturity);
		await page
			.getByRole("button", { name: "Generate proposal bundle" })
			.click();
		await expect(
			page.getByText("Proposal conflict", { exact: true }),
		).toBeVisible();
		await expect(
			page.locator('[data-proposal-state="conflict"]'),
		).toContainText("does not change the current record");
	} finally {
		await context.close();
	}
});
