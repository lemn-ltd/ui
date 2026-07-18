import { lazy } from "react";
import { catalogEntryId } from "../../../catalog/catalog-manifest.js";
import {
	type CatalogPageBinding,
	catalogPageBinding,
} from "../catalog-types.js";

const BlocksPage = lazy(() =>
	import("../../pages/ecosystem/blocks.page.js").then((module) => ({
		default: module.BlocksPage,
	})),
);

export const blockEntries: readonly CatalogPageBinding[] = [
	catalogPageBinding(catalogEntryId("block", "dashboard-overview"), () => (
		<BlocksPage selectedSlug="dashboard-overview" />
	)),
	catalogPageBinding(catalogEntryId("block", "appointment-schedule"), () => (
		<BlocksPage selectedSlug="appointment-schedule" />
	)),
];
