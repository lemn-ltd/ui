import { describe, expect, it } from "vitest";
import { canonicalJson, compileBrandProject, sha256 } from "../index.js";
import { makeBrandProject } from "./fixtures.js";

describe("canonical JSON and hashing", () => {
	it("sorts object keys recursively while preserving array order", () => {
		const first = {
			z: [{ b: 2, a: 1 }, "second"],
			a: { y: true, x: null },
			ignored: undefined,
		};
		const reordered = {
			a: { x: null, y: true },
			z: [{ a: 1, b: 2 }, "second"],
		};

		expect(canonicalJson(first)).toBe(
			'{"a":{"x":null,"y":true},"z":[{"a":1,"b":2},"second"]}',
		);
		expect(canonicalJson(reordered)).toBe(canonicalJson(first));
		expect(canonicalJson({ values: [2, 1] })).not.toBe(
			canonicalJson({ values: [1, 2] }),
		);
	});

	it("produces the expected Web Crypto SHA-256 digest", async () => {
		const canonical = canonicalJson({ b: 2, a: 1 });

		await expect(sha256(canonical)).resolves.toBe(
			"43258cff783fe7036d8a43033f830adfc60ec037382473548ac742b888292777",
		);
	});

	it("rejects values that canonical JSON cannot represent", () => {
		expect(() => canonicalJson(Number.NaN)).toThrow("non-finite");
		expect(() => canonicalJson(Number.POSITIVE_INFINITY)).toThrow("non-finite");
		expect(() => canonicalJson(1n)).toThrow("bigint");
	});

	it("keeps source and compiled hashes stable for equivalent authoring order", async () => {
		const first = makeBrandProject();
		const reordered = {
			profiles: first.profiles,
			defaultProfileId: first.defaultProfileId,
			assets: first.assets,
			metadata: first.metadata,
			name: first.name,
			brandId: first.brandId,
			schemaVersion: first.schemaVersion,
			$schema: first.$schema,
		};

		const [left, right] = await Promise.all([
			compileBrandProject(first),
			compileBrandProject(reordered),
		]);

		expect(left.ok).toBe(true);
		expect(right.ok).toBe(true);
		if (!left.ok || !right.ok) return;
		expect(left.artifact.sourceHash).toBe(right.artifact.sourceHash);
		expect(left.artifact.compiledHash).toBe(right.artifact.compiledHash);
		expect(left.artifact.criticalCss).toBe(right.artifact.criticalCss);
	});
});
