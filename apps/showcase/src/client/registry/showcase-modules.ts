import type { ShowcaseArea } from '@appranks/showcase-kit';
import type { UiShowcaseEntry } from './showcase-types.js';

export type ShowcaseModuleId = ShowcaseArea;

export interface ShowcaseModule {
  readonly id: ShowcaseModuleId;
  readonly name: string;
  readonly mark: string;
  readonly summary: string;
}

export const DEFAULT_SHOWCASE_MODULE_ID: ShowcaseModuleId = 'core';

export const SHOWCASE_MODULES: readonly ShowcaseModule[] = [
  {
    id: 'core',
    name: 'Core',
    mark: 'CO',
    summary:
      'Foundations, primitives, forms, overlays, navigation, data display, feedback, layout, and core patterns.',
  },
  {
    id: 'agents',
    name: 'Agents',
    mark: 'AG',
    summary: 'Agent-specific conversation, automation, approval, runtime, and evidence surfaces.',
  },
];

const MODULE_BY_ID = new Map(SHOWCASE_MODULES.map((module) => [module.id, module]));

export function moduleForEntry(entry: Pick<UiShowcaseEntry, 'area'>): ShowcaseModuleId {
  return entry.area ?? DEFAULT_SHOWCASE_MODULE_ID;
}

export function entriesForModule(
  registry: readonly UiShowcaseEntry[],
  moduleId: ShowcaseModuleId,
): UiShowcaseEntry[] {
  return registry.filter((entry) => moduleForEntry(entry) === moduleId);
}

export function moduleForId(moduleId: string): ShowcaseModule | undefined {
  return MODULE_BY_ID.get(moduleId as ShowcaseModuleId);
}

export function moduleIdForPathname(pathname: string): ShowcaseModuleId {
  return pathname.startsWith('/agents/') ? 'agents' : DEFAULT_SHOWCASE_MODULE_ID;
}
