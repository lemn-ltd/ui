import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.BASE_URL ?? "http://localhost:6501";

export default defineConfig({
	testDir: "./tests/e2e",
	testMatch: "**/*.e2e.ts",
	fullyParallel: false,
	forbidOnly: Boolean(process.env.CI),
	retries: process.env.CI ? 2 : 0,
	workers: 1,
	reporter: process.env.CI ? "github" : [["html", { open: "never" }]],
	timeout: 120_000,
	webServer:
		process.env.BASE_URL === undefined
			? {
					command: "pnpm --filter @lemn-ltd/ui-brand-lab run dev",
					reuseExistingServer: true,
					timeout: 120_000,
					url: baseURL,
				}
			: undefined,
	use: {
		...devices["Desktop Chrome"],
		actionTimeout: 15_000,
		baseURL,
		screenshot: "only-on-failure",
		trace: "on-first-retry",
		viewport: { width: 1440, height: 960 },
	},
});
