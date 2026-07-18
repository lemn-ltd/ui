import {
	type BlockCatalogEntry,
	coreBlockCatalog,
} from "./core-block-catalog.js";

export {
	type BlockCatalogEntry,
	type BlockStatus,
	coreBlockCatalog,
} from "./core-block-catalog.js";

export const agentBlockCatalog: readonly BlockCatalogEntry[] = Object.freeze([
	{
		components: ["ApprovalCard", "EmptyState", "Skeleton", "Alert"],
		purpose:
			"Resolve a bounded queue of human approval requests with complete loading and empty states.",
		slug: "approval-queue",
		status: "beta",
		title: "Approval queue",
	},
]);

export const blockCatalog: readonly BlockCatalogEntry[] = Object.freeze([
	...coreBlockCatalog,
	...agentBlockCatalog,
]);
