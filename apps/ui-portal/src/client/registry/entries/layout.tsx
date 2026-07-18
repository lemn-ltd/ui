import { lazy } from "react";
import type { CatalogPageBinding } from "../catalog-types.js";
import { componentEntry } from "../component-entry.js";

const ScreenShellPage = lazy(
	() => import("../../pages/core/components/screen-shell.page.js"),
);
const ContentLayoutPage = lazy(
	() => import("../../pages/core/components/content-layout.page.js"),
);
const PageSectionPage = lazy(
	() => import("../../pages/core/components/page-section.page.js"),
);
const SectionGridPage = lazy(
	() => import("../../pages/core/components/section-grid.page.js"),
);
const TwoColumnPage = lazy(
	() => import("../../pages/core/components/two-column.page.js"),
);
const SettingsShellPage = lazy(
	() => import("../../pages/core/components/settings-shell.page.js"),
);
const SignInScreenPage = lazy(
	() => import("../../pages/core/components/sign-in-screen.page.js"),
);
const VersionTagPage = lazy(
	() => import("../../pages/core/components/version-tag.page.js"),
);

export const layoutEntries: CatalogPageBinding[] = [
	componentEntry("screen-shell", () => <ScreenShellPage />),
	componentEntry("content-layout", () => <ContentLayoutPage />),
	componentEntry("page-section", () => <PageSectionPage />),
	componentEntry("section-grid", () => <SectionGridPage />),
	componentEntry("two-column", () => <TwoColumnPage />),
	componentEntry("settings-shell", () => <SettingsShellPage />),
	componentEntry("sign-in-screen", () => <SignInScreenPage />),
	componentEntry("version-tag", () => <VersionTagPage />),
];
