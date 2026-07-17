import { describe, expect, it } from "vitest";
import {
	type CompiledBrandingModeObject,
	type CompiledBrandingObject,
	canonicalJson,
	compileBrandingDefinition,
	createCompiledBrandingModeObject,
	createCompiledBrandingObject,
	getCompiledMode,
	getCompiledModeCriticalCss,
	serializeBrandingBootstrap,
	sha256,
	verifyBrandingArtifact,
	verifyCompiledBrandingModeObject,
	verifyCompiledBrandingObject,
} from "../../src/index.js";
import { makeBrandingDefinition } from "../fixtures/branding-definition.js";

describe("deterministic branding compilation", () => {
	it("emits complete immutable mode projections and minimal bootstrap", async () => {
		const result = await compileBrandingDefinition(makeBrandingDefinition());
		expect(result.ok).toBe(true);
		if (!result.ok) return;

		expect(Object.keys(result.artifact.modes)).toEqual(["dark", "light"]);
		expect(result.artifact.allowedModeIds).toEqual(["dark", "light"]);
		const light = getCompiledMode(result.artifact, "light");
		expect(light.attributes).toEqual({
			"data-lemn-brand-scope": light.id,
			"data-lemn-branding": expect.stringMatching(/^[a-f0-9]{64}$/),
			"data-lemn-mode": "light",
		});
		expect(light.tokens["--lemn-color-accent"]).toBe("#4f46c8");
		expect(getCompiledModeCriticalCss(result.artifact, "light")).toContain(
			light.selector,
		);
		expect(getCompiledModeCriticalCss(result.artifact, "light")).not.toContain(
			result.artifact.modes.dark?.selector,
		);
		expect(result.artifact.fullCss).toContain(
			result.artifact.modes.dark?.selector,
		);
		expect(result.artifact.fullCss).toContain(
			result.artifact.modes.light?.selector,
		);

		const bootstrap = JSON.parse(
			serializeBrandingBootstrap(result.artifact, "light"),
		);
		expect(bootstrap).toMatchObject({
			compiledHash: result.artifact.compiledHash,
			definitionHash: result.artifact.definitionHash,
			modeHash: light.modeHash,
			modeId: "light",
			colorScheme: "light",
			tokens: { "--lemn-color-accent": "#4f46c8" },
			visualization: {
				recharts: { series: expect.any(Array) },
				echarts: { color: expect.any(Array) },
			},
			componentAppearance: {
				controls: "solid",
				cards: "bordered",
				inputs: "outlined",
			},
		});
		expect(bootstrap).not.toHaveProperty("fontResources");
		expect(Object.isFrozen(result.artifact)).toBe(true);
		expect(Object.isFrozen(result.artifact.modes.light?.tokens)).toBe(true);
		expect(Object.isFrozen(result.artifact.modes.light?.echarts.tooltip)).toBe(
			true,
		);
		await expect(
			verifyBrandingArtifact(result.artifact),
		).resolves.toBeUndefined();
	});

	it("retains every complete mode section in the typed compiled projection", async () => {
		const result = await compileBrandingDefinition(makeBrandingDefinition());
		if (!result.ok) throw new Error("Fixture must compile");
		const configuration = result.artifact.modes.light?.configuration;
		expect(configuration).toMatchObject({
			spacingAndDensity: { density: "comfortable" },
			motion: { decorativeMotion: true, reducedMotion: "reduce" },
			visualization: {
				sequential: expect.any(Array),
				diverging: expect.any(Array),
			},
			iconography: { family: "Lucide", style: "outline", strokeWidth: 2 },
			accessibility: {
				minimumTargetSize: 44,
				forceVisibleFocus: true,
				forcedColors: "system",
				automaticCorrections: "derived-only",
			},
			componentAppearance: {
				controls: "solid",
				cards: "bordered",
				inputs: "outlined",
			},
		});
	});

	it("enforces non-selectable runtime mode policy", async () => {
		const definition = makeBrandingDefinition();
		definition.runtimeSelection = { selectable: false };
		const result = await compileBrandingDefinition(definition);
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.artifact.allowedModeIds).toEqual(["light"]);
		expect(() => getCompiledMode(result.artifact, "dark")).toThrow(
			"not allowed",
		);
	});

	it("creates and verifies a signed immutable object envelope", async () => {
		const result = await compileBrandingDefinition(makeBrandingDefinition());
		if (!result.ok) throw new Error("Fixture must compile");
		const signer = async (payload: string) => ({
			algorithm: "Ed25519" as const,
			keyId: "test-key-v1",
			value: await fakeSignature(payload),
		});
		const envelope = await createCompiledBrandingObject(
			result.artifact,
			signer,
		);
		await expect(
			verifyCompiledBrandingObject(
				envelope,
				async (payload, signature) =>
					signature.keyId === "test-key-v1" &&
					signature.value === (await fakeSignature(payload)),
			),
		).resolves.toBeUndefined();
		expect(envelope.byteHash).toMatch(/^[a-f0-9]{64}$/);
		expect(Object.isFrozen(envelope.signature)).toBe(true);

		const metadataTamper = {
			...envelope,
			compiledHash: "f".repeat(64),
		} as CompiledBrandingObject;
		await expect(
			verifyCompiledBrandingObject(metadataTamper, () => true),
		).rejects.toThrow("metadata");

		const signatureTamper = {
			...envelope,
			signature: { ...envelope.signature, value: "invalid" },
		} as CompiledBrandingObject;
		await expect(
			verifyCompiledBrandingObject(
				signatureTamper,
				async (payload, signature) =>
					signature.value === (await fakeSignature(payload)),
			),
		).rejects.toThrow("signature");

		const byteTamper = {
			...envelope,
			byteHash: "a".repeat(64),
		} as CompiledBrandingObject;
		await expect(
			verifyCompiledBrandingObject(byteTamper, () => true),
		).rejects.toThrow("byte hash");

		const artifactTamper = structuredClone(envelope) as CompiledBrandingObject;
		const lightMode = artifactTamper.artifact.modes.light;
		if (!lightMode) throw new Error("test artifact must define light mode");
		(lightMode.tokens as Record<string, string>)["--lemn-color-accent"] =
			"#ffffff";
		await expect(
			verifyCompiledBrandingObject(artifactTamper, () => true),
		).rejects.toThrow("integrity");
	});

	it("signs one minimal Workspace-bound mode projection without private or other-mode data", async () => {
		const definition = makeBrandingDefinition();
		const dark = definition.modes.dark;
		if (!dark) throw new Error("fixture must contain dark mode");
		dark.extensions = {
			"com.lemn.private-sentinel": "OTHER_MODE_PRIVATE_SENTINEL",
		};
		definition.assets = {
			"primary-logo": {
				id: "primary-logo",
				kind: "logo",
				storageKey: "private/workspaces/ws-1/logo.svg",
				sha256: "a".repeat(64),
				mediaType: "image/svg+xml",
			},
		};
		definition.assetRoles = { primaryLogo: "primary-logo" };
		const result = await compileBrandingDefinition(definition);
		if (!result.ok) throw new Error("fixture must compile");
		const signer = async (payload: string) => ({
			algorithm: "Ed25519" as const,
			keyId: "test-key-v1",
			value: await fakeSignature(payload),
		});
		const modeObject = await createCompiledBrandingModeObject(
			{
				artifact: result.artifact,
				workspaceId: "workspace-lunaria",
				brandingVersionId: "branding-version-7",
				version: 7,
				modeId: "light",
				assetDeliveries: {
					"primary-logo": {
						href: "https://assets.ui.le-mn.com/ws-1/logo-a.svg",
					},
				},
			},
			signer,
		);
		await expect(
			verifyCompiledBrandingModeObject(
				modeObject,
				async (payload, signature) =>
					signature.keyId === "test-key-v1" &&
					signature.value === (await fakeSignature(payload)),
			),
		).resolves.toBeUndefined();

		const serialized = JSON.stringify({ source: "active", modeObject });
		expect(serialized).not.toContain("OTHER_MODE_PRIVATE_SENTINEL");
		expect(serialized).not.toContain("private/workspaces/ws-1/logo.svg");
		expect(serialized).not.toContain('"artifact"');
		expect(serialized).not.toContain('"modes"');
		expect(serialized).not.toContain("storageKey");
		expect(serialized).not.toContain("configuration");
		expect(modeObject.projection.assetReferences).toEqual([
			expect.objectContaining({
				id: "primary-logo",
				roles: ["primaryLogo"],
				href: "https://assets.ui.le-mn.com/ws-1/logo-a.svg",
				integrity: expect.stringMatching(/^sha256-/),
			}),
		]);
		expect(modeObject.projection.allowedModeIds).toEqual(["dark", "light"]);
		expect(modeObject.projection.modeId).toBe("light");
	});

	it("recalculates the canonical projection hash and binds signed Workspace identity", async () => {
		const result = await compileBrandingDefinition(makeBrandingDefinition());
		if (!result.ok) throw new Error("fixture must compile");
		const modeObject = await createCompiledBrandingModeObject(
			{
				artifact: result.artifact,
				workspaceId: "workspace-lunaria",
				brandingVersionId: "branding-version-1",
				version: 1,
				modeId: "light",
				assetDeliveries: {},
			},
			async (payload) => ({
				algorithm: "Ed25519",
				keyId: "test-key-v1",
				value: await fakeSignature(payload),
			}),
		);

		const payloadTamper = structuredClone(
			modeObject,
		) as CompiledBrandingModeObject;
		(payloadTamper.projection.bootstrap.tokens as Record<string, string>)[
			"--lemn-color-accent"
		] = "#ffffff";
		await expect(
			verifyCompiledBrandingModeObject(payloadTamper, () => true),
		).rejects.toThrow("projection hash");

		const identityTamper = structuredClone(
			modeObject,
		) as CompiledBrandingModeObject;
		(identityTamper.projection as { workspaceId: string }).workspaceId =
			"workspace-other";
		(identityTamper as { projectionHash: string }).projectionHash =
			await sha256(canonicalJson(identityTamper.projection));
		await expect(
			verifyCompiledBrandingModeObject(
				identityTamper,
				async (payload, signature) =>
					signature.value === (await fakeSignature(payload)),
			),
		).rejects.toThrow("signature");
	});

	it("projects only the selected mode custom icon set and its semantic tokens", async () => {
		const definition = makeBrandingDefinition();
		definition.assets = {
			"light-icons": {
				id: "light-icons",
				kind: "icon",
				storageKey: "private/workspaces/ws-1/light-icons.svg",
				sha256: "a".repeat(64),
				mediaType: "image/svg+xml",
			},
			"dark-icons": {
				id: "dark-icons",
				kind: "icon",
				storageKey: "private/workspaces/ws-1/dark-icons.svg",
				sha256: "b".repeat(64),
				mediaType: "image/svg+xml",
			},
		};
		const light = definition.modes.light;
		const dark = definition.modes.dark;
		if (!light || !dark) throw new Error("fixture must contain both modes");
		light.iconography = {
			...light.iconography,
			family: "Lemn Custom",
			style: "duotone",
			strokeWidth: 1.5,
			defaultSize: "24px",
			customSetAssetId: "light-icons",
		};
		dark.iconography.customSetAssetId = "dark-icons";
		const result = await compileBrandingDefinition(definition);
		if (!result.ok) throw new Error("fixture must compile");

		const modeObject = await createCompiledBrandingModeObject(
			{
				artifact: result.artifact,
				workspaceId: "workspace-lunaria",
				brandingVersionId: "branding-version-1",
				version: 1,
				modeId: "light",
				assetDeliveries: {
					"light-icons": {
						href: "https://assets.ui.le-mn.com/ws-1/light-icons.svg",
					},
				},
			},
			async (payload) => ({
				algorithm: "Ed25519",
				keyId: "test-key-v1",
				value: await fakeSignature(payload),
			}),
		);

		expect(modeObject.projection.assetReferences).toEqual([
			expect.objectContaining({
				id: "light-icons",
				roles: ["customIconSet"],
			}),
		]);
		expect(modeObject.projection.bootstrap.tokens).toMatchObject({
			"--lemn-icon-style": "duotone",
			"--lemn-icon-stroke-width": "1.5",
			"--lemn-icon-size": "24px",
		});
		expect(modeObject.projection.bootstrap.iconography).toEqual({
			family: "Lemn Custom",
			style: "duotone",
			strokeWidth: 1.5,
			defaultSize: "24px",
			customSetAssetId: "light-icons",
		});
		expect(JSON.stringify(modeObject)).not.toContain("dark-icons");
	});

	it("keeps an arbitrary icon family out of critical CSS", async () => {
		const definition = makeBrandingDefinition();
		const light = definition.modes.light;
		if (!light) throw new Error("fixture must contain light mode");
		light.iconography.family = "x; } body { display:none";
		const result = await compileBrandingDefinition(definition);
		if (!result.ok) throw new Error("fixture must compile");

		const criticalCss = getCompiledModeCriticalCss(result.artifact, "light");
		expect(criticalCss).not.toContain(light.iconography.family);
		expect(criticalCss).not.toContain("body { display:none");
	});

	it("rejects non-canonical signing key identifiers without normalizing them", async () => {
		const result = await compileBrandingDefinition(makeBrandingDefinition());
		if (!result.ok) throw new Error("fixture must compile");
		const input = {
			artifact: result.artifact,
			workspaceId: "workspace-lunaria",
			brandingVersionId: "branding-version-1",
			version: 1,
			modeId: "light",
			assetDeliveries: {},
		} as const;

		for (const keyId of [" test-key-v1", "test-key-v1\nother"]) {
			await expect(
				createCompiledBrandingModeObject(input, async (payload) => ({
					algorithm: "Ed25519",
					keyId,
					value: await fakeSignature(payload),
				})),
			).rejects.toThrow("invalid signature");
		}
	});
});

async function fakeSignature(payload: string): Promise<string> {
	const bytes = await crypto.subtle.digest(
		"SHA-256",
		new TextEncoder().encode(payload),
	);
	return Buffer.from(bytes).toString("base64url");
}
