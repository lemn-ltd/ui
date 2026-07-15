import { describe, expect, it } from "vitest";

import { compileBrandProject } from "../../../src/branding/compiler";
import { parseBrandProject } from "../../../src/branding/contract";
import {
	builtInBrandProjects,
	defaultBrandProject,
} from "../../../src/branding/presets";
import {
	type BrandSnapshotStore,
	resolveBrandProject,
	resolveBuiltInBrandProjects,
} from "../../../src/branding/snapshot-store";

describe("brand snapshot fallback resolution", () => {
	it("returns a complete branded fallback for a normal KV miss", async () => {
		const store: BrandSnapshotStore = {
			getPublished: async () => null,
			publish: async () => {
				throw new Error("not used");
			},
		};

		await expect(
			resolveBrandProject(defaultBrandProject.id, store),
		).resolves.toEqual({
			project: defaultBrandProject,
			snapshot: compileBrandProject(defaultBrandProject),
			source: "fallback",
			degraded: false,
		});
	});

	it("marks unavailable or failed persistence as degraded without losing branding", async () => {
		const unavailable = await resolveBrandProject(defaultBrandProject.id);
		expect(unavailable).toMatchObject({
			project: defaultBrandProject,
			source: "fallback",
			degraded: true,
		});
		expect(unavailable.snapshot.tokens["--brand-accent"]).toBe(
			defaultBrandProject.colors.accent,
		);

		const failingStore: BrandSnapshotStore = {
			getPublished: async () => {
				throw new Error("KV unavailable");
			},
			publish: async () => {
				throw new Error("not used");
			},
		};
		const pairedDarkProject = builtInBrandProjects.find(
			(project) => project.id === "codex-github-dark",
		);
		if (!pairedDarkProject) {
			throw new Error("Missing Codex GitHub dark project fixture");
		}
		const failed = await resolveBrandProject(
			pairedDarkProject.id,
			failingStore,
		);
		expect(failed.source).toBe("fallback");
		expect(failed.degraded).toBe(true);
		expect(failed.snapshot.projectId).toBe(pairedDarkProject.id);
		expect(failed.snapshot.cssText).toContain("--brand-background");
	});

	it("returns a valid published project as the KV source", async () => {
		const project = parseBrandProject({
			...defaultBrandProject,
			colors: { ...defaultBrandProject.colors, accent: "#0057ff" },
		});
		const store: BrandSnapshotStore = {
			getPublished: async () => ({
				project,
				snapshot: compileBrandProject(project),
			}),
			publish: async () => ({
				project,
				snapshot: compileBrandProject(project),
			}),
		};

		await expect(resolveBrandProject(project.id, store)).resolves.toEqual({
			project,
			snapshot: compileBrandProject(project),
			source: "kv",
			degraded: false,
		});
	});

	it("keeps all built-in projects in stable catalog order", async () => {
		const store: BrandSnapshotStore = {
			getPublished: async () => null,
			publish: async (project) => ({
				project,
				snapshot: compileBrandProject(project),
			}),
		};

		const resolved = await resolveBuiltInBrandProjects(store);

		expect(resolved).toHaveLength(builtInBrandProjects.length);
		expect(resolved.map(({ project }) => project.id)).toEqual(
			builtInBrandProjects.map(({ id }) => id),
		);
		expect(resolved.every(({ snapshot }) => snapshot.cssText.length > 0)).toBe(
			true,
		);
	});

	it("does not use an unknown id as a KV key and resolves the default project", async () => {
		const requestedIds: string[] = [];
		const store: BrandSnapshotStore = {
			getPublished: async (projectId) => {
				requestedIds.push(projectId);
				return null;
			},
			publish: async (project) => ({
				project,
				snapshot: compileBrandProject(project),
			}),
		};

		const resolved = await resolveBrandProject("../../unexpected", store);

		expect(requestedIds).toEqual([defaultBrandProject.id]);
		expect(resolved.project.id).toBe(defaultBrandProject.id);
		expect(resolved.snapshot.projectId).toBe(defaultBrandProject.id);
	});
});
