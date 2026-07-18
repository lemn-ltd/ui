import { type CatalogEntry, groupBy } from "./catalog-types.js";

export interface CatalogNavGroup<
	TGroup extends string = string,
	TEntry extends CatalogEntry<TGroup> = CatalogEntry<TGroup>,
> {
	readonly group: TGroup;
	readonly entries: TEntry[];
}

export function buildNavGroups<
	TGroup extends string,
	TEntry extends CatalogEntry<TGroup>,
>(
	registry: readonly TEntry[],
	groupOrder: readonly TGroup[],
): CatalogNavGroup<TGroup, TEntry>[] {
	const byGroup = groupBy(registry, "group");
	return groupOrder
		.map((group) => ({ group, entries: byGroup.get(group) ?? [] }))
		.filter((section) => section.entries.length > 0);
}
