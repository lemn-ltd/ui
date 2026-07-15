import type { BrandStudioStepId } from "./types.js";

export type BrandStudioStep = {
  readonly id: BrandStudioStepId;
  readonly label: string;
  readonly description: string;
  readonly advanced?: boolean;
};

export const brandStudioSteps: readonly BrandStudioStep[] = [
  { id: "identity", label: "Identity", description: "Name, ownership and contract identity." },
  { id: "presets", label: "Starting point", description: "Choose an original LEMN preset without losing editability." },
  { id: "assets", label: "Assets", description: "Managed logos, icons and fonts referenced by content hash." },
  { id: "profiles", label: "Profiles & modes", description: "Expressions that can switch atomically at runtime." },
  { id: "colors", label: "Colors", description: "Semantic surfaces, content, accent and state roles." },
  { id: "typography", label: "Typography", description: "Font roles, weights, scale, rhythm and tracking." },
  { id: "shape", label: "Shape & elevation", description: "Borders, radii, focus treatment and shadows." },
  { id: "density-motion", label: "Density & motion", description: "Control rhythm, timing and reduced-motion policy.", advanced: true },
  { id: "visualization", label: "Visualization", description: "Provider-neutral chart palettes and interaction colors." },
  { id: "accessibility", label: "Accessibility", description: "WCAG policy, focus, targets and forced colors." },
  { id: "components", label: "Components", description: "Narrow appearance roles without behavior overrides.", advanced: true },
  { id: "review", label: "Review & JSON", description: "Diagnostics and source/resolved/compiled contracts." }
];
