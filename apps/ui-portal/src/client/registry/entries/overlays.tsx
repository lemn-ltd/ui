import { lazy } from "react";
import type { CatalogPageBinding } from "../catalog-types.js";
import { componentEntry } from "../component-entry.js";

const DialogPage = lazy(
	() => import("../../pages/core/components/dialog.page.js"),
);
const DrawerPage = lazy(
	() => import("../../pages/core/components/drawer.page.js"),
);
const MarkdownViewerPage = lazy(
	() => import("../../pages/core/components/markdown-viewer.page.js"),
);
const ConfirmDialogPage = lazy(
	() => import("../../pages/core/components/confirm-dialog.page.js"),
);
const FormDialogPage = lazy(
	() => import("../../pages/core/components/form-dialog.page.js"),
);
const MenuPage = lazy(() => import("../../pages/core/components/menu.page.js"));
const PopoverPage = lazy(
	() => import("../../pages/core/components/popover.page.js"),
);
const TooltipPage = lazy(
	() => import("../../pages/core/components/tooltip.page.js"),
);
const HintIconPage = lazy(
	() => import("../../pages/core/components/hint-icon.page.js"),
);
const CommandPalettePage = lazy(
	() => import("../../pages/core/components/command-palette.page.js"),
);

export const overlaysEntries: CatalogPageBinding[] = [
	componentEntry("dialog", () => <DialogPage />),
	componentEntry("drawer", () => <DrawerPage />),
	componentEntry("markdown-viewer", () => <MarkdownViewerPage />),
	componentEntry("confirm-dialog", () => <ConfirmDialogPage />),
	componentEntry("form-dialog", () => <FormDialogPage />),
	componentEntry("menu", () => <MenuPage />),
	componentEntry("popover", () => <PopoverPage />),
	componentEntry("tooltip", () => <TooltipPage />),
	componentEntry("hint-icon", () => <HintIconPage />),
	componentEntry("command-palette", () => <CommandPalettePage />),
];
