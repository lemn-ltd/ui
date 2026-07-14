import { createHash } from "node:crypto";
import { chromium } from "@playwright/test";

const baseUrl = process.env.BASE_URL ?? "http://127.0.0.1:6500";
const reviewedSha = process.env.BENCHMARK_SHA ?? "working-tree";
const scenarios = [];

for (const viewport of [
	{ name: "desktop", width: 1280, height: 900 },
	{ name: "mobile", width: 375, height: 812 },
]) {
	for (const theme of ["light", "dark"]) {
		for (const reducedMotion of ["no-preference", "reduce"]) {
			for (const dataset of ["representative", "stress"]) {
				scenarios.push({ dataset, reducedMotion, theme, viewport });
			}
		}
	}
}

const browser = await chromium.launch({ headless: true });
const results = [];

try {
	for (const scenario of scenarios) {
		const context = await browser.newContext({
			colorScheme: scenario.theme,
			reducedMotion: scenario.reducedMotion,
			viewport: scenario.viewport,
		});
		await context.addInitScript((theme) => {
			window.localStorage.setItem("color-theme", theme);
			window.__visualizationBenchmarkLayoutShift = 0;
			new PerformanceObserver((entries) => {
				for (const entry of entries.getEntries()) {
					if (!entry.hadRecentInput)
						window.__visualizationBenchmarkLayoutShift += entry.value;
				}
			}).observe({ type: "layout-shift", buffered: true });
		}, scenario.theme);
		const page = await context.newPage();
		const response = await page.goto(
			`${baseUrl}/core/patterns/dashboard?dataset=${scenario.dataset}`,
			{ waitUntil: "networkidle" },
		);
		if (!response?.ok())
			throw new Error(`Benchmark route returned ${response?.status()}.`);
		await page
			.locator('[data-benchmark-ready="true"]')
			.waitFor({ state: "visible" });
		await page
			.locator(".ui-chart-visualization__canvas")
			.first()
			.waitFor({ state: "visible" });
		const readyMs = await page.evaluate(async () => {
			await new Promise((resolve) =>
				requestAnimationFrame(() => requestAnimationFrame(resolve)),
			);
			return performance.now();
		});
		const legend = page.locator(".ui-chart-legend button").first();
		const interactionMs = await legend.evaluate(async (button) => {
			const start = performance.now();
			button.click();
			await new Promise((resolve) =>
				requestAnimationFrame(() => requestAnimationFrame(resolve)),
			);
			return performance.now() - start;
		});
		const layoutShift = await page.evaluate(
			() => window.__visualizationBenchmarkLayoutShift ?? 0,
		);
		const screenshot = await page.screenshot({ fullPage: true });
		results.push({
			dataset: scenario.dataset,
			interactionMs: Number(interactionMs.toFixed(2)),
			layoutShift: Number(layoutShift.toFixed(4)),
			readyMs: Number(readyMs.toFixed(2)),
			reducedMotion: scenario.reducedMotion,
			screenshotSha256: createHash("sha256").update(screenshot).digest("hex"),
			theme: scenario.theme,
			viewport: scenario.viewport.name,
		});
		await context.close();
	}
} finally {
	await browser.close();
}

process.stdout.write(
	`${JSON.stringify(
		{
			baseUrl,
			environment: {
				arch: process.arch,
				node: process.version,
				platform: process.platform,
				playwright: "1.60.0",
			},
			reviewedSha,
			route: "/core/patterns/dashboard",
			scenarios: results,
		},
		null,
		2,
	)}\n`,
);
