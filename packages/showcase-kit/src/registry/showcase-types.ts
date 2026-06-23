import type { ReactElement } from 'react';

export type ShowcaseKind = 'foundation' | 'component' | 'pattern';
export type ShowcaseArea = 'core' | 'agents';
export type ShowcaseStatus = 'stable' | 'beta';

export interface ShowcaseEntry<TGroup extends string = string> {
  readonly area?: ShowcaseArea;
  readonly slug: string;
  readonly title: string;
  readonly group: TGroup;
  readonly kind: ShowcaseKind;
  readonly summary: string;
  readonly status?: ShowcaseStatus;
  readonly page: () => ReactElement;
}

export interface ShowcaseEntryMeta<TGroup extends string = string> {
  readonly area?: ShowcaseArea;
  readonly slug: string;
  readonly title: string;
  readonly group: TGroup;
  readonly kind: ShowcaseKind;
  readonly summary: string;
  readonly status?: ShowcaseStatus;
}

const KIND_PREFIX: Record<ShowcaseKind, string> = {
  foundation: 'foundations',
  component: 'components',
  pattern: 'patterns',
};

export function pathFor(entry: Pick<ShowcaseEntry, 'area' | 'kind' | 'slug'>): string {
  return `/${entry.area ?? 'core'}/${KIND_PREFIX[entry.kind]}/${entry.slug}`;
}

export function groupBy<TItem, TKey extends keyof TItem>(
  items: readonly TItem[],
  key: TKey,
): Map<TItem[TKey], TItem[]> {
  const groups = new Map<TItem[TKey], TItem[]>();
  for (const item of items) {
    const value = item[key];
    const bucket = groups.get(value);
    if (bucket) {
      bucket.push(item);
    } else {
      groups.set(value, [item]);
    }
  }
  return groups;
}

export function entryFromMeta<TGroup extends string>(
  meta: ShowcaseEntryMeta<TGroup>,
  page: () => ReactElement,
): ShowcaseEntry<TGroup> {
  return {
    ...meta,
    page,
  };
}
