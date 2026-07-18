import type { ReactElement } from "react";

export type CatalogKind = "foundation" | "component" | "block" | "pattern";
export type CatalogArea = "core";
export type CatalogStatus = "stable" | "beta";

export interface CatalogEntry<TGroup extends string = string> {
	readonly area?: CatalogArea;
	readonly slug: string;
	readonly title: string;
	readonly group: TGroup;
	readonly kind: CatalogKind;
	readonly summary: string;
	readonly status?: CatalogStatus;
	readonly page: () => ReactElement;
}

export interface CatalogEntryMeta<TGroup extends string = string> {
	readonly area?: CatalogArea;
	readonly slug: string;
	readonly title: string;
	readonly group: TGroup;
	readonly kind: CatalogKind;
	readonly summary: string;
	readonly status?: CatalogStatus;
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
	meta: CatalogEntryMeta<TGroup>,
	page: () => ReactElement,
): CatalogEntry<TGroup> {
	return {
		...meta,
		page,
	};
}
