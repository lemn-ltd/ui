import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
	parseProductionPortalEdgeAccessEnabled,
	productionPortalEdgeAccessEnabled,
} from "../../scripts/release/zero-trust-posture.ts";

test("the production smoke posture is read from the canonical disabled manifest", async () => {
	assert.equal(await productionPortalEdgeAccessEnabled(), false);
});

test("the production smoke posture accepts only the exact project contract", async () => {
	const source = await readFile(
		"tooling/manifests/infrastructure/zero-trust.json",
		"utf8",
	);
	const manifest = JSON.parse(source) as Record<string, unknown>;
	const enabled = structuredClone(manifest) as {
		environments: {
			production: {
				enabled: boolean;
				applications: Array<{ id: string; enabled?: boolean }>;
			};
		};
	};
	enabled.environments.production.enabled = true;
	assert.equal(
		parseProductionPortalEdgeAccessEnabled(JSON.stringify(enabled)),
		true,
	);
	const disabledPortal = structuredClone(enabled);
	disabledPortal.environments.production.applications[0] = {
		...disabledPortal.environments.production.applications[0],
		enabled: false,
	};
	assert.equal(
		parseProductionPortalEdgeAccessEnabled(JSON.stringify(disabledPortal)),
		false,
	);
	const missingPortal = structuredClone(enabled);
	missingPortal.environments.production.applications[0] = {
		...missingPortal.environments.production.applications[0],
		id: "another-application",
	};

	for (const invalid of [
		{},
		{ ...manifest, version: 2 },
		{ ...manifest, projectId: "another-project" },
		missingPortal,
	]) {
		assert.throws(
			() => parseProductionPortalEdgeAccessEnabled(JSON.stringify(invalid)),
			/valid production posture|configuration\./u,
		);
	}
});
