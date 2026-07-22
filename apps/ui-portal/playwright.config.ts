import { createHash } from "node:crypto";
import { realpathSync } from "node:fs";
import { defineConfig, devices } from "@playwright/test";

const E2E_PORT_MIN = 20_000;
const E2E_PORT_SPAN = 20_000;

export function portalE2ePortForCheckout(checkoutPath: string): number {
	const digest = createHash("sha256").update(checkoutPath).digest();
	return E2E_PORT_MIN + (digest.readUInt16BE(0) % E2E_PORT_SPAN);
}

const PORTAL_ROOT = realpathSync(import.meta.dirname);
const E2E_PORT = portalE2ePortForCheckout(PORTAL_ROOT);
const BASE_URL = `http://127.0.0.1:${E2E_PORT}`;
const E2E_ADMIN_AUDIENCE = "a".repeat(64);
const E2E_HEALTH_AUDIENCE = "b".repeat(64);
const E2E_BUILD_SHA = "d".repeat(40);

const VIEWPORTS = {
	mobile: { width: 375, height: 812 },
	tablet: { width: 768, height: 1024 },
	desktop: { width: 1280, height: 900 },
} as const;

const THEMES = ["light", "dark"] as const;

const VISUAL_MATCH = /visual\.e2e\.ts/;
const ACCESSIBILITY_MATCH = /accessibility\.e2e\.ts/;

export function portalE2eWorkerCount(
	environment: Readonly<Record<string, string | undefined>> = process.env,
): number {
	const configured = environment.PLAYWRIGHT_WORKERS;
	if (configured !== undefined) {
		const parsed = Number(configured);
		if (!Number.isSafeInteger(parsed) || parsed < 1) {
			throw new Error(
				`PLAYWRIGHT_WORKERS must be a positive integer, received ${JSON.stringify(configured)}`,
			);
		}
		return parsed;
	}
	return environment.CI ? 2 : 4;
}

// Light/Dark x {375,768,1280} = 6 deterministic visual projects; the theme is
// applied per project by the deterministic test base (keyed off the name).
const visualProjects = THEMES.flatMap((theme) =>
	(Object.keys(VIEWPORTS) as (keyof typeof VIEWPORTS)[]).map((size) => ({
		name: `visual-${theme}-${size}`,
		testMatch: VISUAL_MATCH,
		use: {
			...devices["Desktop Chrome"],
			viewport: VIEWPORTS[size],
			colorScheme: theme,
			deviceScaleFactor: 1,
		},
	})),
);

export default defineConfig({
	testDir: "./tests/e2e",
	testMatch: ["**/*.e2e.ts"],
	snapshotPathTemplate:
		"{testDir}/{testFilePath}-snapshots/{arg}-{projectName}-{platform}{ext}",
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: portalE2eWorkerCount(),
	reporter: process.env.CI ? "github" : [["html", { open: "never" }]],
	timeout: 120_000,
	expect: {
		toHaveScreenshot: { maxDiffPixelRatio: 0.01, animations: "disabled" },
	},
	webServer: {
		command: `pnpm exec vite build && pnpm exec wrangler dev --local --ip 127.0.0.1 --port ${E2E_PORT} --log-level warn --show-interactive-dev-session=false --var DEPLOYMENT_ENVIRONMENT:test --var ACCESS_ISSUER:https://lemn-dev.cloudflareaccess.com --var ACCESS_AUDIENCE:${E2E_ADMIN_AUDIENCE} --var ACCESS_HEALTH_AUDIENCE:${E2E_HEALTH_AUDIENCE} --var BUILD_VERSION:0.0.0-e2e --var BUILD_GIT_SHA:${E2E_BUILD_SHA} --var BUILD_TIME:2026-07-18T00:00:00Z`,
		cwd: PORTAL_ROOT,
		url: BASE_URL,
		reuseExistingServer: false,
		gracefulShutdown: { signal: "SIGTERM", timeout: 5_000 },
		timeout: 120_000,
	},
	use: {
		...devices["Desktop Chrome"],
		baseURL: BASE_URL,
		permissions: ["clipboard-read", "clipboard-write"],
		trace: "on-first-retry",
		screenshot: "only-on-failure",
		deviceScaleFactor: 1,
	},
	projects: [
		{
			name: "behavior",
			testIgnore: [VISUAL_MATCH, ACCESSIBILITY_MATCH],
			use: {
				...devices["Desktop Chrome"],
				viewport: VIEWPORTS.desktop,
				colorScheme: "light",
				deviceScaleFactor: 1,
			},
		},
		{
			name: "accessibility",
			fullyParallel: true,
			testMatch: ACCESSIBILITY_MATCH,
			use: {
				...devices["Desktop Chrome"],
				viewport: VIEWPORTS.desktop,
				colorScheme: "light",
				deviceScaleFactor: 1,
			},
		},
		...visualProjects,
	],
});
