export interface SkeletonPreset {
  readonly id: string;
  readonly label: string;
  readonly count: number;
}

/** Skeleton presets: a 3-line text block and an 8-row table block. */
export const skeletonPresets: readonly SkeletonPreset[] = [
  { id: 'text', label: 'Text', count: 3 },
  { id: 'table', label: 'Table', count: 8 },
];

export const skeletonTextLines = 3;
export const skeletonTableRows = 8;
