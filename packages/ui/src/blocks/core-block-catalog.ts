export type BlockStatus = "beta" | "stable";

export interface BlockCatalogEntry {
	readonly components: readonly string[];
	readonly purpose: string;
	readonly slug: string;
	readonly status: BlockStatus;
	readonly title: string;
}

/** Curated Core compositions; blocks never become alternate primitives. */
export const coreBlockCatalog: readonly BlockCatalogEntry[] = Object.freeze([
	{
		components: ["StatCard", "LineChart", "BarList", "Alert", "Skeleton"],
		purpose:
			"Summarize operating metrics, a trend, and a ranked breakdown in one report surface.",
		slug: "dashboard-overview",
		status: "beta",
		title: "Dashboard overview",
	},
	{
		components: ["Card", "Badge", "Button", "EmptyState", "Skeleton"],
		purpose:
			"Present a time-ordered appointment queue with explicit status and host-owned actions.",
		slug: "appointment-schedule",
		status: "beta",
		title: "Appointment schedule",
	},
]);
