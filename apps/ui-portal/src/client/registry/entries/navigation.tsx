import { lazy } from "react";
import type { CatalogPageBinding } from "../catalog-types.js";
import { componentEntry } from "../component-entry.js";

const SidebarPage = lazy(
	() => import("../../pages/core/components/sidebar.page.js"),
);
const TopBarPage = lazy(
	() => import("../../pages/core/components/top-bar.page.js"),
);
const EntityToolbarPage = lazy(
	() => import("../../pages/core/components/entity-toolbar.page.js"),
);
const BreadcrumbPage = lazy(
	() => import("../../pages/core/components/breadcrumb.page.js"),
);
const TabsPage = lazy(() => import("../../pages/core/components/tabs.page.js"));
const StepperPage = lazy(
	() => import("../../pages/core/components/stepper.page.js"),
);
const OrgSwitcherPage = lazy(
	() => import("../../pages/core/components/org-switcher.page.js"),
);
const PaginationPage = lazy(
	() => import("../../pages/core/components/pagination.page.js"),
);
const DockPanelPage = lazy(
	() => import("../../pages/core/components/dock-panel.page.js"),
);

export const navigationEntries: CatalogPageBinding[] = [
	componentEntry("sidebar", () => <SidebarPage />),
	componentEntry("top-bar", () => <TopBarPage />),
	componentEntry("entity-toolbar", () => <EntityToolbarPage />),
	componentEntry("breadcrumb", () => <BreadcrumbPage />),
	componentEntry("tabs", () => <TabsPage />),
	componentEntry("stepper", () => <StepperPage />),
	componentEntry("org-switcher", () => <OrgSwitcherPage />),
	componentEntry("pagination", () => <PaginationPage />),
	componentEntry("dock-panel", () => <DockPanelPage />),
];
