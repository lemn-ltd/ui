import { expect, test } from "@playwright/test";

test("configures one project and applies the brand atomically to real providers", async ({
	page,
}) => {
	const pageErrors: string[] = [];
	page.on("pageerror", (error) => pageErrors.push(error.message));
	page.on("console", (message) => {
		if (message.type() === "error") pageErrors.push(message.text());
	});

	await page.goto("/?project=codex-github-light");
	await expect(page.locator("html")).toHaveAttribute("data-hydration", "ready");
	await expect(
		page.getByLabel("Brand preset", { exact: true }).locator("option"),
	).toHaveCount(49);
	await expect(
		page.getByRole("button", { name: "Generate report" }),
	).toBeVisible();
	await expect(
		page.getByRole("checkbox", { name: "Include period comparison" }),
	).toBeChecked();
	await expect(
		page.locator('[data-chart-provider="apache-echarts"] svg'),
	).toBeVisible();
	await expect(page.locator('[data-chart-provider="recharts"]')).toHaveCount(2);
	for (const kind of ["bar", "donut"] as const) {
		await expect(
			page.locator(`[data-chart-kind="${kind}"] svg.recharts-surface`).first(),
		).toBeVisible();
	}

	const initialLayoutSamples: Array<{
		documentHeight: number;
		chartHeights: number[];
	}> = [];
	for (let index = 0; index < 8; index += 1) {
		await page.waitForTimeout(80);
		initialLayoutSamples.push(
			await page.evaluate(() => ({
				documentHeight: document.documentElement.scrollHeight,
				chartHeights: Array.from(
					document.querySelectorAll("[data-chart-provider]"),
					(element) => element.getBoundingClientRect().height,
				),
			})),
		);
	}
	expect(
		new Set(initialLayoutSamples.map(({ documentHeight }) => documentHeight))
			.size,
	).toBe(1);
	for (const { chartHeights } of initialLayoutSamples) {
		expect(chartHeights).toHaveLength(3);
		for (const chartHeight of chartHeights) {
			expect(chartHeight).toBeGreaterThanOrEqual(300);
			expect(chartHeight).toBeLessThanOrEqual(340);
		}
	}

	await page.evaluate(() => {
		const frames: Array<{
			rootHash: string;
			chartHashes: string[];
			styleMatches: boolean;
		}> = [];
		let remaining = 24;
		const sample = () => {
			const rootHash = document.documentElement.dataset.brandHash ?? "";
			const chartHashes = Array.from(
				document.querySelectorAll<HTMLElement>("[data-chart-provider]"),
				(chart) => chart.dataset.brandHash ?? "",
			);
			const css =
				document.getElementById("brand-project-styles")?.textContent ?? "";
			frames.push({
				rootHash,
				chartHashes,
				styleMatches: css.includes(`[data-brand-hash="${rootHash}"]`),
			});
			remaining -= 1;
			if (remaining > 0) requestAnimationFrame(sample);
		};
		Reflect.set(window, "__brandLabFrames", frames);
		requestAnimationFrame(sample);
	});

	await page
		.getByLabel("Brand preset", { exact: true })
		.selectOption("lemn-aster-vault");
	await page.getByRole("radio", { name: "dark" }).check();
	await expect(page.locator("html")).toHaveAttribute(
		"data-brand-appearance",
		"dark",
	);
	await expect(
		page.getByRole("heading", { name: "Aster Vault" }),
	).toBeVisible();
	await expect(page).toHaveURL(/project=lemn-aster-vault-dark/);
	await page.waitForTimeout(450);

	const frames = await page.evaluate(
		() =>
			Reflect.get(window, "__brandLabFrames") as Array<{
				rootHash: string;
				chartHashes: string[];
				styleMatches: boolean;
			}>,
	);
	expect(frames.length).toBeGreaterThan(2);
	for (const frame of frames) {
		expect(frame.rootHash).toBeTruthy();
		expect(frame.chartHashes).toHaveLength(3);
		for (const chartHash of frame.chartHashes) {
			expect(chartHash).toBe(frame.rootHash);
		}
		expect(frame.styleMatches).toBe(true);
	}

	await page.locator(".brand-lab-steps button", { hasText: "Colors" }).click();
	const accentHex = page.getByLabel("Accent", { exact: true });
	const initialAccent = await accentHex.inputValue();
	await accentHex.fill("#1188cc");
	await accentHex.press("Enter");
	await expect(page.locator("html")).not.toHaveAttribute(
		"data-brand-hash",
		frames.at(0)?.rootHash ?? "",
	);
	await expect(page.getByRole("button", { name: "Generate report" })).toHaveCSS(
		"background-color",
		"rgb(17, 136, 204)",
	);

	await page.getByText("Advanced semantic colors", { exact: true }).click();
	const chartPrimary = page.getByLabel("Chart 1", { exact: true });
	const initialChartPrimary = await chartPrimary.inputValue();
	await chartPrimary.fill("#d946ef");
	await chartPrimary.press("Enter");
	await expect(
		page
			.locator('[data-chart-provider="apache-echarts"] path[stroke="#d946ef"]')
			.first(),
	).toBeAttached();
	for (const kind of ["bar", "donut"] as const) {
		const chart = page.locator(`[data-chart-kind="${kind}"]`);
		await expect(chart).toHaveAttribute("data-chart-primary", "#d946ef");
		await expect(chart.locator('[fill="#d946ef"]').first()).toBeAttached();
	}

	await page
		.locator(".brand-lab-steps button", { hasText: "Typography" })
		.click();
	await page.getByLabel("Body family").selectOption("mono");
	await expect(page.locator("body")).toHaveCSS(
		"font-family",
		/.*SFMono-Regular.*/,
	);

	await page.locator(".brand-lab-steps button", { hasText: "Shape" }).click();
	await page
		.locator('.brand-lab-fields input[type="range"]')
		.first()
		.fill("18");
	await expect(page.getByRole("button", { name: "Generate report" })).toHaveCSS(
		"border-radius",
		"18px",
	);

	// Restore the color values changed by this browser proof so local KV remains
	// deterministic when the user publishes a project manually afterward.
	await page.locator(".brand-lab-steps button", { hasText: "Colors" }).click();
	await accentHex.fill(initialAccent);
	await accentHex.press("Enter");
	await page.getByText("Advanced semantic colors", { exact: true }).click();
	await chartPrimary.fill(initialChartPrimary);
	await chartPrimary.press("Enter");

	await page.setViewportSize({ width: 390, height: 844 });
	await expect(
		page.locator('[data-chart-kind="donut"] svg.recharts-surface').first(),
	).toBeVisible();
	const mobileSamples: Array<{
		documentHeight: number;
		documentWidth: number;
		clientWidth: number;
		chartHeights: number[];
	}> = [];
	for (let index = 0; index < 8; index += 1) {
		await page.waitForTimeout(60);
		mobileSamples.push(
			await page.evaluate(() => ({
				documentHeight: document.documentElement.scrollHeight,
				documentWidth: document.documentElement.scrollWidth,
				clientWidth: document.documentElement.clientWidth,
				chartHeights: Array.from(
					document.querySelectorAll("[data-chart-provider]"),
					(element) => element.getBoundingClientRect().height,
				),
			})),
		);
	}
	expect(
		new Set(mobileSamples.map(({ documentHeight }) => documentHeight)).size,
	).toBe(1);
	for (const sample of mobileSamples) {
		expect(sample.documentWidth).toBeLessThanOrEqual(sample.clientWidth + 1);
		expect(sample.chartHeights).toHaveLength(3);
		for (const chartHeight of sample.chartHeights) {
			expect(chartHeight).toBeGreaterThanOrEqual(300);
			expect(chartHeight).toBeLessThanOrEqual(340);
		}
	}

	expect(pageErrors).toEqual([]);
});

test("applies Cloudflare and Apple visual references to the same provider components", async ({
	page,
}) => {
	await page.goto("/?project=reference-cloudflare-dashboard-dark");
	await expect(page.locator("html")).toHaveAttribute("data-hydration", "ready");
	await expect(page.locator("html")).toHaveAttribute(
		"data-brand-appearance",
		"dark",
	);
	await expect(
		page.getByRole("heading", { name: "Cloudflare Dashboard" }),
	).toBeVisible();
	await expect(page.getByRole("button", { name: "Generate report" })).toHaveCSS(
		"border-radius",
		"8px",
	);
	await expect(
		page.locator('[data-chart-provider="apache-echarts"] svg'),
	).toBeVisible();
	await expect(page.locator('[data-chart-provider="recharts"]')).toHaveCount(2);

	await page.goto("/?project=reference-apple-system-light");
	await expect(page.locator("html")).toHaveAttribute("data-hydration", "ready");
	await expect(page.locator("html")).toHaveAttribute(
		"data-brand-appearance",
		"light",
	);
	await expect(page.getByRole("heading", { name: "Apple" })).toBeVisible();
	await expect(page.getByRole("button", { name: "Generate report" })).toHaveCSS(
		"border-radius",
		"20px",
	);
	await expect(
		page.locator('[data-chart-provider="apache-echarts"] svg'),
	).toBeVisible();
	await expect(page.locator('[data-chart-provider="recharts"]')).toHaveCount(2);
});

test("publishes a versioned project to KV and returns it in the next SSR response", async ({
	page,
}) => {
	await page.goto("/?project=codex-github-light");
	await expect(page.locator("html")).toHaveAttribute("data-hydration", "ready");

	await page.locator(".brand-lab-steps button", { hasText: "Colors" }).click();
	const accentHex = page.getByLabel("Accent", { exact: true });
	const originalAccent = await accentHex.inputValue();
	const proofAccent =
		originalAccent.toLowerCase() === "#2477d4" ? "#7c3aed" : "#2477d4";
	await accentHex.fill(proofAccent);
	await accentHex.press("Enter");

	await page.locator(".brand-lab-steps button", { hasText: "Review" }).click();
	await page.getByRole("button", { name: "Publish to local KV" }).click();
	await expect(page.getByRole("status")).toContainText("Published");
	const publishedHash = await page
		.locator("html")
		.getAttribute("data-brand-hash");

	await page.getByRole("link", { name: "Reload SSR proof" }).click();
	await expect(page.locator("html")).toHaveAttribute("data-hydration", "ready");
	await expect(page.locator("html")).toHaveAttribute(
		"data-brand-hash",
		publishedHash ?? "",
	);
	await expect(page.getByText("KV published", { exact: true })).toBeVisible();
	await expect(page.getByRole("button", { name: "Generate report" })).toHaveCSS(
		"background-color",
		hexToRgb(proofAccent),
	);

	// Restore the pre-test project contract and publish it so this proof is
	// repeatable against the same local KV namespace.
	await page.locator(".brand-lab-steps button", { hasText: "Colors" }).click();
	await page.getByLabel("Accent", { exact: true }).fill(originalAccent);
	await page.getByLabel("Accent", { exact: true }).press("Enter");
	await page.locator(".brand-lab-steps button", { hasText: "Review" }).click();
	await page.getByRole("button", { name: "Publish to local KV" }).click();
	await expect(page.getByRole("status")).toContainText("Published");
});

function hexToRgb(hex: string): string {
	const value = Number.parseInt(hex.slice(1), 16);
	return `rgb(${(value >> 16) & 255}, ${(value >> 8) & 255}, ${value & 255})`;
}
