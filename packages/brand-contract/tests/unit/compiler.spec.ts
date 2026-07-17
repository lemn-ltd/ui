import { describe, expect, it } from "vitest";
import {
	type CompiledBrandingObject,
	compileBrandingDefinition,
	createCompiledBrandingObject,
	getCompiledMode,
	getCompiledModeCriticalCss,
	serializeBrandingBootstrap,
	verifyBrandingArtifact,
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
});

async function fakeSignature(payload: string): Promise<string> {
	const bytes = await crypto.subtle.digest(
		"SHA-256",
		new TextEncoder().encode(payload),
	);
	return Buffer.from(bytes).toString("base64url");
}
