export const PORTAL_VISUAL_PAGE_CASES = [
	["overview", "/"],
	["button", "/components/button"],
	["checkbox", "/components/checkbox"],
	["badge", "/components/badge"],
	["calendar", "/components/calendar"],
	["dialog", "/components/dialog"],
	["data-table", "/components/data-table"],
	["sidebar", "/components/sidebar"],
	["info-banner", "/components/info-banner"],
	["tracker", "/visualizations/tracker"],
	["settings-shell", "/components/settings-shell"],
	["colors", "/foundations/colors"],
	["dashboard", "/patterns/dashboard"],
] as const;

export const PORTAL_VISUAL_SCREENSHOT_NAMES = [
	...PORTAL_VISUAL_PAGE_CASES.map(([name]) => name),
	"overview-bento",
	"overview-bento-compact",
] as const;

export const PORTAL_VISUAL_PROJECT_NAMES = [
	"visual-dark-desktop",
	"visual-dark-mobile",
	"visual-dark-tablet",
	"visual-light-desktop",
	"visual-light-mobile",
	"visual-light-tablet",
] as const;

export const PORTAL_VISUAL_BASELINE_PLATFORMS = ["darwin", "linux"] as const;

export const PORTAL_VISUAL_SNAPSHOT_COUNT_PER_PLATFORM =
	PORTAL_VISUAL_SCREENSHOT_NAMES.length * PORTAL_VISUAL_PROJECT_NAMES.length;
