import type { BrandProject } from "./contract";

export type BrandPresetSource =
	| "codex-open-source"
	| "lemn-original"
	| "visual-reference";

export interface BrandPresetDefinition {
	readonly id: string;
	readonly name: string;
	readonly source: BrandPresetSource;
	readonly description: string;
	readonly upstreamThemeId?: string;
	readonly terminalAdaptive?: boolean;
	readonly typography: BrandProject["typography"];
	readonly shape: BrandProject["shape"];
	readonly elevation: BrandProject["elevation"];
	readonly density: BrandProject["density"];
	readonly light: BrandProject["colors"];
	readonly dark: BrandProject["colors"];
}

export interface BrandPresetFamily {
	readonly id: string;
	readonly name: string;
	readonly source: BrandPresetSource;
	readonly description: string;
	readonly upstreamThemeId?: string;
	readonly terminalAdaptive: boolean;
	readonly lightProjectId: string;
	readonly darkProjectId: string;
}
