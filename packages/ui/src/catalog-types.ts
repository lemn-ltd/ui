/** The distributed module that owns a component and its public route namespace. */
export type ComponentArea = 'core' | 'agents';

/** Functional families available only to Core components. */
export type CoreComponentGroup =
  | 'Primitives'
  | 'Inputs'
  | 'Forms'
  | 'Visualizations'
  | 'Data display'
  | 'Feedback'
  | 'Overlays'
  | 'Navigation'
  | 'Layout';

/** Functional families available only to Agents components. */
export type AgentComponentGroup =
  | 'Conversation'
  | 'Governance'
  | 'Approvals'
  | 'Automation'
  | 'Runtime & evidence';

interface BaseCatalogEntry {
  readonly slug: string;
  readonly title: string;
  readonly status: 'stable' | 'beta';
  readonly intent: string;
}

/** Area-discriminated catalog entry; invalid cross-module families cannot compile. */
export type ComponentCatalogEntry =
  | (BaseCatalogEntry & {
      readonly area: 'core';
      readonly group: CoreComponentGroup;
    })
  | (BaseCatalogEntry & {
      readonly area: 'agents';
      readonly group: AgentComponentGroup;
    });
