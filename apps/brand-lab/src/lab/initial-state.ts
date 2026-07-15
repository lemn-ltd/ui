import type { CompiledBrandSnapshot } from "../branding/compiler";
import type { BrandProject } from "../branding/contract";

export interface BrandProjectRecord {
	readonly project: BrandProject;
	readonly source: "kv" | "fallback";
	readonly degraded: boolean;
}

export interface BrandLabInitialState {
	readonly projects: readonly BrandProjectRecord[];
	readonly activeProject: BrandProject;
	readonly snapshot: CompiledBrandSnapshot;
	readonly initialChartSvg: string;
	readonly storageSource: "kv" | "fallback";
	readonly storageDegraded: boolean;
	readonly csrfToken: string;
}

export function isBrandLabInitialState(
	input: unknown,
): input is BrandLabInitialState {
	if (
		!isRecord(input) ||
		!Array.isArray(input.projects) ||
		!isRecord(input.activeProject)
	) {
		return false;
	}

	return (
		typeof input.initialChartSvg === "string" &&
		typeof input.csrfToken === "string" &&
		(input.storageSource === "kv" || input.storageSource === "fallback") &&
		typeof input.storageDegraded === "boolean" &&
		isCompiledSnapshot(input.snapshot)
	);
}

function isCompiledSnapshot(input: unknown): input is CompiledBrandSnapshot {
	return (
		isRecord(input) &&
		input.schemaVersion === 1 &&
		typeof input.projectId === "string" &&
		typeof input.projectName === "string" &&
		typeof input.hash === "string" &&
		typeof input.version === "string" &&
		typeof input.cssText === "string" &&
		isRecord(input.tokens) &&
		isRecord(input.chartTheme)
	);
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}
