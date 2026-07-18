import assert from "node:assert/strict";
import { readdir } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";
import playwrightConfig from "../../playwright.config.ts";
import {
	PORTAL_VISUAL_BASELINE_PLATFORMS,
	PORTAL_VISUAL_PROJECT_NAMES,
	PORTAL_VISUAL_SCREENSHOT_NAMES,
	PORTAL_VISUAL_SNAPSHOT_COUNT_PER_PLATFORM,
} from "../fixtures/visual-baselines.ts";

const snapshotRoot = resolve(
	import.meta.dirname,
	"../e2e/visual.e2e.ts-snapshots",
);

function expectedSnapshotFiles(): string[] {
	return PORTAL_VISUAL_SCREENSHOT_NAMES.flatMap((screenshotName) =>
		PORTAL_VISUAL_PROJECT_NAMES.flatMap((projectName) =>
			PORTAL_VISUAL_BASELINE_PLATFORMS.map(
				(platform) => `${screenshotName}-${projectName}-${platform}.png`,
			),
		),
	).sort();
}

test("visual baselines exactly match the active Portal screenshots and Darwin/Linux projects", async () => {
	const configuredVisualProjects = (playwrightConfig.projects ?? [])
		.map((project) => project.name)
		.filter((name) => name?.startsWith("visual-"))
		.sort();
	assert.deepEqual(
		configuredVisualProjects,
		[...PORTAL_VISUAL_PROJECT_NAMES],
		"Playwright must retain the exact Light/Dark x mobile/tablet/desktop visual matrix",
	);
	assert.equal(
		PORTAL_VISUAL_SNAPSHOT_COUNT_PER_PLATFORM,
		90,
		"The active Portal visual suite must retain 90 screenshots per baseline platform",
	);

	const actual = (await readdir(snapshotRoot))
		.filter((file) => file.endsWith(".png"))
		.sort();
	const expected = expectedSnapshotFiles();
	const expectedSet = new Set(expected);
	const actualSet = new Set(actual);
	const missing = expected.filter((file) => !actualSet.has(file));
	const orphaned = actual.filter((file) => !expectedSet.has(file));

	assert.deepEqual(
		{ missing, orphaned },
		{ missing: [], orphaned: [] },
		[
			"Visual snapshot inventory drifted from visual.e2e.ts and playwright.config.ts.",
			`Missing (${missing.length}): ${missing.join(", ") || "none"}`,
			`Orphaned (${orphaned.length}): ${orphaned.join(", ") || "none"}`,
		].join("\n"),
	);
});
