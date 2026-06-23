import { groupBy, type ShowcaseEntry } from './showcase-types.js';

export interface ShowcaseNavGroup<TGroup extends string = string> {
  readonly group: TGroup;
  readonly entries: ShowcaseEntry<TGroup>[];
}

export function buildNavGroups<TGroup extends string>(
  registry: readonly ShowcaseEntry<TGroup>[],
  groupOrder: readonly TGroup[],
): ShowcaseNavGroup<TGroup>[] {
  const byGroup = groupBy(registry, 'group');
  return groupOrder
    .map((group) => ({ group, entries: byGroup.get(group) ?? [] }))
    .filter((section) => section.entries.length > 0);
}
