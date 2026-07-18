import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";
import {
	activeCoreComponentRoutes,
	renderUrlForMaster,
} from "../../apps/ui-portal/tests/fidelity/build-contact-sheets.ts";

const root = resolve(import.meta.dirname, "../..");

test("fidelity routes are exact active Core catalog projections", () => {
	const routes = activeCoreComponentRoutes([
		{
			area: "core",
			kind: "component",
			path: "/components/button",
			slug: "button",
		},
		{
			area: "core",
			kind: "component",
			path: "/visualizations/area-chart",
			slug: "area-chart",
		},
		{
			area: "agents",
			kind: "component",
			path: "/source-retained/approval-card",
			slug: "approval-card",
		},
		{
			area: "core",
			kind: "block",
			path: "/blocks/dashboard-overview",
			slug: "dashboard-overview",
		},
	]);

	assert.deepEqual(
		[...routes],
		[
			["button", "/components/button"],
			["area-chart", "/visualizations/area-chart"],
		],
	);
	assert.equal(
		renderUrlForMaster(
			{ slug: "area-chart" },
			routes,
			"https://portal.ui.le-mn.com",
		),
		"https://portal.ui.le-mn.com/visualizations/area-chart",
	);
	assert.throws(
		() => renderUrlForMaster({ slug: "approval-card" }, routes),
		/not an active Core component/u,
	);
});

test("fidelity route projection fails closed on invalid catalog authority", () => {
	assert.throws(
		() =>
			activeCoreComponentRoutes([
				{
					area: "core",
					kind: "component",
					path: "/components/button",
					slug: "button",
				},
				{
					area: "core",
					kind: "component",
					path: "/components/button-duplicate",
					slug: "button",
				},
			]),
		/Duplicate active Core component slug/u,
	);
	assert.throws(
		() =>
			activeCoreComponentRoutes([
				{
					area: "core",
					kind: "component",
					path: "https://example.test/components/button",
					slug: "button",
				},
			]),
		/non-canonical path/u,
	);
	assert.throws(() => activeCoreComponentRoutes([]), {
		message: "The active Core component catalog is empty.",
	});
});

test("contact-sheet generator imports the canonical manifest without legacy route construction", async () => {
	const source = await readFile(
		resolve(root, "apps/ui-portal/tests/fidelity/build-contact-sheets.ts"),
		"utf8",
	);

	assert.match(source, /\.\.\/\.\.\/src\/catalog\/catalog-manifest\.ts/u);
	assert.equal(source.includes(["${area}", "components"].join("/")), false);
	assert.doesNotMatch(source, /group\s*===\s*["']Agents["']/u);
});
