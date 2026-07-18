import { lazy } from "react";
import type { CatalogPageBinding } from "../catalog-types.js";
import { componentEntry } from "../component-entry.js";

const ToastPage = lazy(
	() => import("../../pages/core/components/toast.page.js"),
);
const ToasterPage = lazy(
	() => import("../../pages/core/components/toaster.page.js"),
);
const InfoBannerPage = lazy(
	() => import("../../pages/core/components/info-banner.page.js"),
);
const SystemBarPage = lazy(
	() => import("../../pages/core/components/system-bar.page.js"),
);
const SkeletonPage = lazy(
	() => import("../../pages/core/components/skeleton.page.js"),
);
const SpinnerPage = lazy(
	() => import("../../pages/core/components/spinner.page.js"),
);
const ProgressBarPage = lazy(
	() => import("../../pages/core/components/progress-bar.page.js"),
);

export const feedbackEntries: CatalogPageBinding[] = [
	componentEntry("toast", () => <ToastPage />),
	componentEntry("toaster", () => <ToasterPage />),
	componentEntry("info-banner", () => <InfoBannerPage />),
	componentEntry("system-bar", () => <SystemBarPage />),
	componentEntry("skeleton", () => <SkeletonPage />),
	componentEntry("spinner", () => <SpinnerPage />),
	componentEntry("progress-bar", () => <ProgressBarPage />),
];
