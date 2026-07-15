import { describe, expect, it } from "vitest";

import { compileBrandProject } from "../../../src/branding/compiler";
import { parseBrandProject } from "../../../src/branding/contract";
import {
	BrandSnapshotStorageError,
	createKvBrandSnapshotStore,
	publishedBrandPointerKey,
	versionedBrandSnapshotKey,
} from "../../../src/branding/kv-snapshot-store";
import { defaultBrandProject } from "../../../src/branding/presets";

class MemoryKv {
	readonly values = new Map<string, string>();
	readonly writes: Array<{ key: string; value: string }> = [];
	failWriteNumber: number | null = null;

	async get(key: string): Promise<string | null> {
		return this.values.get(key) ?? null;
	}

	async put(key: string, value: string): Promise<void> {
		this.writes.push({ key, value });
		if (this.writes.length === this.failWriteNumber) {
			throw new Error("KV write failed");
		}
		this.values.set(key, value);
	}

	asNamespace(): KVNamespace {
		return this as unknown as KVNamespace;
	}
}

describe("Cloudflare KV brand snapshot adapter", () => {
	it("uses explicit, versioned project keys", () => {
		expect(publishedBrandPointerKey(defaultBrandProject.id)).toBe(
			"brand-project:v1:codex-github-light:published",
		);
		expect(versionedBrandSnapshotKey(defaultBrandProject.id, "0123abcd")).toBe(
			"brand-project:v1:codex-github-light:snapshot:0123abcd",
		);
		expect(() => publishedBrandPointerKey("../secret")).toThrow(
			BrandSnapshotStorageError,
		);
		expect(() =>
			versionedBrandSnapshotKey(defaultBrandProject.id, "not-a-hash"),
		).toThrow(BrandSnapshotStorageError);
	});

	it("publishes the immutable snapshot before moving the published pointer", async () => {
		const kv = new MemoryKv();
		const store = createKvBrandSnapshotStore(kv.asNamespace());
		const result = await store.publish(defaultBrandProject);
		const snapshotKey = versionedBrandSnapshotKey(
			defaultBrandProject.id,
			result.snapshot.hash,
		);

		expect(kv.writes.map(({ key }) => key)).toEqual([
			snapshotKey,
			publishedBrandPointerKey(defaultBrandProject.id),
		]);
		const snapshotWrite = kv.writes.at(0);
		const pointerWrite = kv.writes.at(1);
		if (!snapshotWrite || !pointerWrite) {
			throw new Error("Expected snapshot and pointer writes");
		}
		expect(JSON.parse(snapshotWrite.value)).toMatchObject({
			schemaVersion: 1,
			project: { id: defaultBrandProject.id },
			snapshot: {
				projectId: defaultBrandProject.id,
				hash: result.snapshot.hash,
				version: result.snapshot.version,
			},
		});
		expect(JSON.parse(pointerWrite.value)).toEqual({
			schemaVersion: 1,
			projectId: defaultBrandProject.id,
			hash: result.snapshot.hash,
			version: result.snapshot.version,
			snapshotKey,
		});
	});

	it("never exposes a new version when the pointer write fails", async () => {
		const kv = new MemoryKv();
		kv.failWriteNumber = 2;
		const store = createKvBrandSnapshotStore(kv.asNamespace());

		await expect(store.publish(defaultBrandProject)).rejects.toThrow(
			"KV write failed",
		);
		expect(kv.writes).toHaveLength(2);
		const snapshotWrite = kv.writes.at(0);
		if (!snapshotWrite) throw new Error("Expected an immutable snapshot write");
		expect(kv.values.has(snapshotWrite.key)).toBe(true);
		expect(
			kv.values.has(publishedBrandPointerKey(defaultBrandProject.id)),
		).toBe(false);
	});

	it("validates identity and recompiles instead of trusting persisted compiled CSS", async () => {
		const kv = new MemoryKv();
		const store = createKvBrandSnapshotStore(kv.asNamespace());
		const published = await store.publish(defaultBrandProject);
		const snapshotKey = versionedBrandSnapshotKey(
			defaultBrandProject.id,
			published.snapshot.hash,
		);
		const persistedValue = kv.values.get(snapshotKey);
		if (!persistedValue) throw new Error("Expected a persisted snapshot");
		const persisted = JSON.parse(persistedValue) as {
			snapshot: { cssText: string };
		};
		persisted.snapshot.cssText = "body { display: none }";
		kv.values.set(snapshotKey, JSON.stringify(persisted));

		const resolved = await store.getPublished(defaultBrandProject.id);

		expect(resolved).toEqual({
			project: defaultBrandProject,
			snapshot: compileBrandProject(defaultBrandProject),
		});
		expect(resolved?.snapshot.cssText).not.toContain("display: none");
	});

	it("rejects missing, malformed, cross-project, or stale published records", async () => {
		const missingKv = new MemoryKv();
		const missingStore = createKvBrandSnapshotStore(missingKv.asNamespace());
		expect(await missingStore.getPublished(defaultBrandProject.id)).toBeNull();

		missingKv.values.set(
			publishedBrandPointerKey(defaultBrandProject.id),
			"not json",
		);
		await expect(
			missingStore.getPublished(defaultBrandProject.id),
		).rejects.toThrow(BrandSnapshotStorageError);

		const kv = new MemoryKv();
		const store = createKvBrandSnapshotStore(kv.asNamespace());
		const published = await store.publish(defaultBrandProject);
		const snapshotKey = versionedBrandSnapshotKey(
			defaultBrandProject.id,
			published.snapshot.hash,
		);
		const recordValue = kv.values.get(snapshotKey);
		if (!recordValue) throw new Error("Expected a persisted snapshot");
		const record = JSON.parse(recordValue) as {
			snapshot: { hash: string };
		};
		record.snapshot.hash = "00000000";
		kv.values.set(snapshotKey, JSON.stringify(record));

		await expect(store.getPublished(defaultBrandProject.id)).rejects.toThrow(
			"Stored brand snapshot identity is inconsistent",
		);
	});

	it("validates projects again at the write boundary", async () => {
		const kv = new MemoryKv();
		const store = createKvBrandSnapshotStore(kv.asNamespace());
		const invalidProject = {
			...defaultBrandProject,
			colors: { ...defaultBrandProject.colors, accent: "red" },
		};

		await expect(
			store.publish(invalidProject as unknown as typeof defaultBrandProject),
		).rejects.toThrow("Cannot publish an invalid brand project");
		expect(kv.writes).toHaveLength(0);
	});

	it("round-trips a valid changed project", async () => {
		const kv = new MemoryKv();
		const store = createKvBrandSnapshotStore(kv.asNamespace());
		const project = parseBrandProject({
			...defaultBrandProject,
			colors: {
				...defaultBrandProject.colors,
				accent: "#0057ff",
				chartPrimary: "#0057ff",
			},
		});

		await store.publish(project);

		expect(await store.getPublished(project.id)).toEqual({
			project,
			snapshot: compileBrandProject(project),
		});
	});
});
