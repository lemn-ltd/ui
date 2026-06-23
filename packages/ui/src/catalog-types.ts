/** The eight presentational component taxonomies (Foundations and Patterns are showcase-only). */
export type ComponentGroup =
  | 'Primitives'
  | 'Forms'
  | 'Overlays'
  | 'Navigation'
  | 'Data display'
  | 'Feedback'
  | 'Layout'
  | 'Agents';

export interface ComponentCatalogEntry {
  slug: string;
  title: string;
  group: ComponentGroup;

  status: 'stable' | 'beta';

  intent: string;
}
