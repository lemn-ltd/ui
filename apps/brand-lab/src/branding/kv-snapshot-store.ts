import { z } from "zod";

import { compileBrandProject } from "./compiler";
import { type BrandProject, parseBrandProject } from "./contract";
import type { BrandSnapshotStore, StoredBrandSnapshot } from "./snapshot-store";

const STORAGE_SCHEMA_VERSION = 1 as const;
const STORAGE_PREFIX = "brand-project:v1";
const PROJECT_ID_PATTERN = /^[a-z][a-z0-9-]{2,39}$/;

const pointerSchema = z
	.object({
		schemaVersion: z.literal(STORAGE_SCHEMA_VERSION),
		projectId: z.string().regex(PROJECT_ID_PATTERN),
		hash: z.string().regex(/^[0-9a-f]{8}$/),
		version: z.string().regex(/^v1-[0-9a-f]{8}$/),
		snapshotKey: z.string().min(1),
	})
	.strict();

const recordSchema = z
	.object({
		schemaVersion: z.literal(STORAGE_SCHEMA_VERSION),
		project: z.unknown(),
		snapshot: z
			.object({
				schemaVersion: z.literal(1),
				projectId: z.string(),
				hash: z.string(),
				version: z.string(),
			})
			.passthrough(),
	})
	.strict();

export class BrandSnapshotStorageError extends Error {
	override readonly name = "BrandSnapshotStorageError";
}

export function publishedBrandPointerKey(projectId: string): string {
	assertProjectId(projectId);
	return `${STORAGE_PREFIX}:${projectId}:published`;
}

export function versionedBrandSnapshotKey(
	projectId: string,
	hash: string,
): string {
	assertProjectId(projectId);
	if (!/^[0-9a-f]{8}$/.test(hash)) {
		throw new BrandSnapshotStorageError("Invalid compiled brand hash");
	}
	return `${STORAGE_PREFIX}:${projectId}:snapshot:${hash}`;
}

/**
 * Cloudflare KV adapter. Publication is intentionally two-phase: write the
 * immutable snapshot first and move the small published pointer only after the
 * snapshot succeeds. A failed pointer write can therefore never expose a
 * missing or partially written snapshot.
 */
export function createKvBrandSnapshotStore(
	kv: KVNamespace,
): BrandSnapshotStore {
	return {
		async getPublished(projectId: string): Promise<StoredBrandSnapshot | null> {
			const pointerKey = publishedBrandPointerKey(projectId);
			const pointerJson = await kv.get(pointerKey);
			if (pointerJson == null) {
				return null;
			}

			const pointer = parseJson(
				pointerJson,
				"published pointer",
				pointerSchema,
			);
			if (pointer.projectId !== projectId) {
				throw new BrandSnapshotStorageError(
					"Published pointer project does not match its key",
				);
			}

			const expectedSnapshotKey = versionedBrandSnapshotKey(
				projectId,
				pointer.hash,
			);
			if (
				pointer.snapshotKey !== expectedSnapshotKey ||
				pointer.version !== `v1-${pointer.hash}`
			) {
				throw new BrandSnapshotStorageError(
					"Published pointer contains inconsistent identity data",
				);
			}

			const recordJson = await kv.get(expectedSnapshotKey);
			if (recordJson == null) {
				throw new BrandSnapshotStorageError(
					"Published brand snapshot is missing",
				);
			}

			const record = parseJson(recordJson, "brand snapshot", recordSchema);
			let project: BrandProject;
			try {
				project = parseBrandProject(record.project);
			} catch (error) {
				throw storageValidationError("Stored brand project is invalid", error);
			}

			if (project.id !== projectId) {
				throw new BrandSnapshotStorageError(
					"Stored brand project does not match its key",
				);
			}

			// Persisted compiled output is evidence only. Recompilation makes the
			// current compiler authoritative and prevents stale/tampered CSS or chart
			// settings from crossing the adapter boundary.
			const snapshot = compileBrandProject(project);
			if (
				record.snapshot.projectId !== snapshot.projectId ||
				record.snapshot.hash !== snapshot.hash ||
				record.snapshot.version !== snapshot.version ||
				pointer.hash !== snapshot.hash ||
				pointer.version !== snapshot.version
			) {
				throw new BrandSnapshotStorageError(
					"Stored brand snapshot identity is inconsistent",
				);
			}

			return { project, snapshot };
		},

		async publish(input: BrandProject): Promise<StoredBrandSnapshot> {
			let project: BrandProject;
			try {
				project = parseBrandProject(input);
			} catch (error) {
				throw storageValidationError(
					"Cannot publish an invalid brand project",
					error,
				);
			}

			const snapshot = compileBrandProject(project);
			const snapshotKey = versionedBrandSnapshotKey(project.id, snapshot.hash);
			const pointerKey = publishedBrandPointerKey(project.id);
			const record = {
				schemaVersion: STORAGE_SCHEMA_VERSION,
				project,
				snapshot,
			};
			const pointer = {
				schemaVersion: STORAGE_SCHEMA_VERSION,
				projectId: project.id,
				hash: snapshot.hash,
				version: snapshot.version,
				snapshotKey,
			};

			await kv.put(snapshotKey, JSON.stringify(record));
			await kv.put(pointerKey, JSON.stringify(pointer));

			return { project, snapshot };
		},
	};
}

function parseJson<T extends z.ZodType>(
	value: string,
	label: string,
	schema: T,
): z.output<T> {
	let input: unknown;
	try {
		input = JSON.parse(value);
	} catch (error) {
		throw storageValidationError(`Stored ${label} is not valid JSON`, error);
	}

	const result = schema.safeParse(input);
	if (!result.success) {
		throw storageValidationError(`Stored ${label} is invalid`, result.error);
	}
	return result.data;
}

function assertProjectId(projectId: string): void {
	if (!PROJECT_ID_PATTERN.test(projectId)) {
		throw new BrandSnapshotStorageError("Invalid brand project id");
	}
}

function storageValidationError(
	message: string,
	cause: unknown,
): BrandSnapshotStorageError {
	return new BrandSnapshotStorageError(
		cause instanceof Error ? `${message}: ${cause.message}` : message,
	);
}
