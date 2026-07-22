import { UI_PACKAGE_INSTALL_COMMAND } from "../../src/client/shared/catalog-kit/package-install";
import {
	catalogComponentRoutes,
	componentRoutesFromCatalog,
} from "../helpers/component-catalog";
import { expect, gotoReady, test } from "../helpers/deterministic";

const legacyUiPackage = `@${["app", "ranks"].join("")}/ui`;
const LEGACY_UI_PACKAGE_PATTERN = new RegExp(
	`${legacyUiPackage}(?![-A-Za-z0-9])`,
	"u",
);

test("documentation inventory matches the runtime catalog", async ({
	page,
}) => {
	await componentRoutesFromCatalog(page);
});

for (const entry of catalogComponentRoutes) {
	test(`documentation contract: ${entry.route}`, async ({ page }) => {
		await gotoReady(page, entry.route);
		const docs = page.locator(".portal-docs-page");
		await expect(docs).toBeVisible();
		expect(
			await docs.innerText(),
			`${entry.route} visible content`,
		).not.toMatch(LEGACY_UI_PACKAGE_PATTERN);
		await expect(docs.locator(".portal-docs-page__title-row > h1")).toHaveCount(
			1,
		);
		await expect(
			docs.getByRole("heading", { level: 1, name: entry.title }),
		).toBeVisible();

		const examples = docs.locator(".portal-example");
		const exampleCount = await examples.count();
		expect(exampleCount, `${entry.route} example count`).toBeGreaterThanOrEqual(
			1,
		);
		expect(exampleCount, `${entry.route} example count`).toBeLessThanOrEqual(3);

		const hero = examples.first();
		await expect(hero.getByRole("tab", { name: "Preview" })).toBeVisible();
		await expect(hero.getByRole("tab", { name: "Code" })).toBeVisible();
		const directPreviewMedia = hero.locator(
			".portal-example__preview > img:only-child, .portal-example__preview > picture:only-child",
		);
		await expect(directPreviewMedia).toHaveCount(0);

		for (let index = 0; index < exampleCount; index += 1) {
			const example = examples.nth(index);
			await example.getByRole("tab", { name: "Code" }).click();
			const code = example.locator(".ui-syntax-code-block__content");
			if (index === 0) {
				await expect(code).toContainText("from '@lemn-ltd/ui';");
			}
			const visibleCode = await code.innerText();
			expect(visibleCode, `${entry.route} public snippet`).not.toMatch(
				LEGACY_UI_PACKAGE_PATTERN,
			);
			expect(visibleCode, `${entry.route} public snippet`).not.toMatch(
				/@latest|@lemn-ltd\/ui\//u,
			);
		}

		await hero.getByRole("button", { name: "Copy code" }).click();
		await expect(hero.getByRole("button", { name: "Copied" })).toBeVisible();
		const clipboardText = await page.evaluate(() =>
			navigator.clipboard.readText(),
		);
		expect(clipboardText, `${entry.route} clipboard`).toContain(
			"from '@lemn-ltd/ui';",
		);
		expect(clipboardText, `${entry.route} clipboard`).not.toMatch(
			LEGACY_UI_PACKAGE_PATTERN,
		);
		await expect(
			docs.getByRole("heading", { name: "Installation" }),
		).toBeVisible();
		await expect(docs).toContainText(UI_PACKAGE_INSTALL_COMMAND);
		await expect(
			docs.getByRole("heading", { name: `API Reference: ${entry.title}` }),
		).toBeVisible();

		const table = docs.getByRole("table");
		await expect(table).toBeVisible();
		const headers = await table.getByRole("columnheader").allTextContents();
		expect(headers).toEqual(["Prop", "Type", "Default", "Description"]);
		expect(await table.getByRole("row").count()).toBeGreaterThan(1);

		await expect(docs.getByLabel(/Switch to (?:dark|light) theme/)).toHaveCount(
			0,
		);
		await expect(page.getByLabel(/Switch to (?:dark|light) theme/)).toHaveCount(
			1,
		);

		const unsafeLinks = await docs.locator("a[href]").evaluateAll((links) =>
			links
				.map((link) => ({
					href: (link as HTMLAnchorElement).href,
					label: link.getAttribute("aria-label"),
					referrerPolicy: (link as HTMLAnchorElement).referrerPolicy,
					rel: (link as HTMLAnchorElement).rel,
					target: (link as HTMLAnchorElement).target,
				}))
				.filter((link) => new URL(link.href).origin !== location.origin)
				.filter(
					(link) =>
						link.target !== "_blank" ||
						link.referrerPolicy !== "no-referrer" ||
						!link.rel.split(/\s+/).includes("noreferrer") ||
						!link.rel.split(/\s+/).includes("noopener") ||
						!link.label?.includes("opens in a new tab"),
				),
		);
		expect(unsafeLinks, JSON.stringify(unsafeLinks)).toEqual([]);

		const overflow = await page.evaluate(
			() =>
				document.documentElement.scrollWidth -
				document.documentElement.clientWidth,
		);
		expect(overflow, `${entry.route} horizontal overflow`).toBeLessThanOrEqual(
			1,
		);
	});
}
