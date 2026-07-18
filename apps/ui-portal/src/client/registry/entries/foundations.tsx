import { lazy } from "react";
import { catalogEntryId } from "../../../catalog/catalog-manifest.js";
import {
	type CatalogPageBinding,
	catalogPageBinding,
} from "../catalog-types.js";

const ColorsPage = lazy(
	() => import("../../pages/core/foundations/colors.page.js"),
);
const TypographyPage = lazy(
	() => import("../../pages/core/foundations/typography.page.js"),
);
const SpacingPage = lazy(
	() => import("../../pages/core/foundations/spacing.page.js"),
);
const ElevationPage = lazy(
	() => import("../../pages/core/foundations/elevation.page.js"),
);
const MotionPage = lazy(
	() => import("../../pages/core/foundations/motion.page.js"),
);
const IconsPage = lazy(
	() => import("../../pages/core/foundations/icons.page.js"),
);

function foundationEntry(
	slug: string,
	page: CatalogPageBinding["page"],
): CatalogPageBinding {
	return catalogPageBinding(catalogEntryId("foundation", slug), page);
}

export const foundationsEntries: CatalogPageBinding[] = [
	foundationEntry("colors", () => <ColorsPage />),
	foundationEntry("typography", () => <TypographyPage />),
	foundationEntry("spacing", () => <SpacingPage />),
	foundationEntry("elevation", () => <ElevationPage />),
	foundationEntry("motion", () => <MotionPage />),
	foundationEntry("icons", () => <IconsPage />),
];
