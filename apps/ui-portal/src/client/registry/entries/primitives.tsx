import { lazy } from "react";
import type { CatalogPageBinding } from "../catalog-types.js";
import { componentEntry } from "../component-entry.js";

const ButtonPage = lazy(
	() => import("../../pages/core/components/button.page.js"),
);
const IconButtonPage = lazy(
	() => import("../../pages/core/components/icon-button.page.js"),
);
const ScrollToBottomButtonPage = lazy(
	() => import("../../pages/core/components/scroll-to-bottom-button.page.js"),
);
const InputPage = lazy(
	() => import("../../pages/core/components/input.page.js"),
);
const TextareaPage = lazy(
	() => import("../../pages/core/components/textarea.page.js"),
);
const SelectPage = lazy(
	() => import("../../pages/core/components/select.page.js"),
);
const SearchPage = lazy(
	() => import("../../pages/core/components/search.page.js"),
);
const CheckboxPage = lazy(
	() => import("../../pages/core/components/checkbox.page.js"),
);
const RadioPage = lazy(
	() => import("../../pages/core/components/radio.page.js"),
);
const TogglePage = lazy(
	() => import("../../pages/core/components/toggle.page.js"),
);
const BadgePage = lazy(
	() => import("../../pages/core/components/badge.page.js"),
);
const TagPage = lazy(() => import("../../pages/core/components/tag.page.js"));
const AvatarPage = lazy(
	() => import("../../pages/core/components/avatar.page.js"),
);
const KbdPage = lazy(() => import("../../pages/core/components/kbd.page.js"));
const MeterPage = lazy(
	() => import("../../pages/core/components/meter.page.js"),
);
const FilterPillPage = lazy(
	() => import("../../pages/core/components/filter-pill.page.js"),
);
const ScopePillPage = lazy(
	() => import("../../pages/core/components/scope-pill.page.js"),
);

export const primitivesEntries: CatalogPageBinding[] = [
	componentEntry("button", () => <ButtonPage />),
	componentEntry("icon-button", () => <IconButtonPage />),
	componentEntry("scroll-to-bottom-button", () => <ScrollToBottomButtonPage />),
	componentEntry("input", () => <InputPage />),
	componentEntry("textarea", () => <TextareaPage />),
	componentEntry("select", () => <SelectPage />),
	componentEntry("search", () => <SearchPage />),
	componentEntry("checkbox", () => <CheckboxPage />),
	componentEntry("radio", () => <RadioPage />),
	componentEntry("toggle", () => <TogglePage />),
	componentEntry("badge", () => <BadgePage />),
	componentEntry("tag", () => <TagPage />),
	componentEntry("avatar", () => <AvatarPage />),
	componentEntry("kbd", () => <KbdPage />),
	componentEntry("meter", () => <MeterPage />),
	componentEntry("filter-pill", () => <FilterPillPage />),
	componentEntry("scope-pill", () => <ScopePillPage />),
];
