import { type CompiledBrandSnapshot, compileBrandProject } from "./compiler";
import type { BrandProject } from "./contract";
import {
	builtInBrandProjects,
	builtInProjectById,
	defaultBrandProject,
} from "./presets";

export interface StoredBrandSnapshot {
	readonly project: BrandProject;
	readonly snapshot: CompiledBrandSnapshot;
}

export interface BrandSnapshotStore {
	getPublished(projectId: string): Promise<StoredBrandSnapshot | null>;
	publish(project: BrandProject): Promise<StoredBrandSnapshot>;
}

export interface ResolvedBrandProject extends StoredBrandSnapshot {
	readonly source: "kv" | "fallback";
	/**
	 * True means persistence was unavailable or failed. A normal KV miss is not
	 * degraded: built-in projects are the intentional, fully branded fallback.
	 */
	readonly degraded: boolean;
}

/**
 * Resolves one allowlisted catalog project without ever returning an unbranded
 * state. Unknown ids deliberately resolve to the default built-in project.
 */
export async function resolveBrandProject(
	projectId: string,
	store?: BrandSnapshotStore | null,
): Promise<ResolvedBrandProject> {
	const fallbackProject = builtInProjectById(projectId) ?? defaultBrandProject;
	const fallback = createFallback(fallbackProject, store == null);

	if (store == null) {
		return fallback;
	}

	try {
		const published = await store.getPublished(fallbackProject.id);
		if (published == null) {
			return createFallback(fallbackProject, false);
		}

		return {
			...published,
			source: "kv",
			degraded: false,
		};
	} catch {
		return createFallback(fallbackProject, true);
	}
}

/** Resolve the complete, fixed MVP project catalog in preset order. */
export async function resolveBuiltInBrandProjects(
	store?: BrandSnapshotStore | null,
): Promise<readonly ResolvedBrandProject[]> {
	return Promise.all(
		builtInBrandProjects.map((project) =>
			resolveBrandProject(project.id, store),
		),
	);
}

function createFallback(
	project: BrandProject,
	degraded: boolean,
): ResolvedBrandProject {
	return {
		project,
		snapshot: compileBrandProject(project),
		source: "fallback",
		degraded,
	};
}
