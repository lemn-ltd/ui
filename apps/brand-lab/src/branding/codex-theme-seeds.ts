/**
 * Web-safe seeds for the 32 themes exposed by Codex's `BUILTIN_THEME_NAMES`.
 * Theme colors come from the embedded theme data in two-face 0.5.1. The three
 * ANSI-family themes encode terminal palette references instead of fixed RGB;
 * their RGB fields below are intentional, deterministic web resolutions.
 */

export const codexBuiltinThemeIds = [
	"1337",
	"ansi",
	"base16",
	"base16-256",
	"base16-eighties-dark",
	"base16-mocha-dark",
	"base16-ocean-dark",
	"base16-ocean-light",
	"catppuccin-frappe",
	"catppuccin-latte",
	"catppuccin-macchiato",
	"catppuccin-mocha",
	"coldark-cold",
	"coldark-dark",
	"dark-neon",
	"dracula",
	"github",
	"gruvbox-dark",
	"gruvbox-light",
	"inspired-github",
	"monokai-extended",
	"monokai-extended-bright",
	"monokai-extended-light",
	"monokai-extended-origin",
	"nord",
	"one-half-dark",
	"one-half-light",
	"solarized-dark",
	"solarized-light",
	"sublime-snazzy",
	"two-dark",
	"zenburn",
] as const;

export type CodexBuiltinThemeId = (typeof codexBuiltinThemeIds)[number];
export type CodexThemeHexColor = `#${string}`;
export type CodexThemeAccents =
	| readonly [CodexThemeHexColor, CodexThemeHexColor, CodexThemeHexColor]
	| readonly [
			CodexThemeHexColor,
			CodexThemeHexColor,
			CodexThemeHexColor,
			CodexThemeHexColor,
	  ];

export interface CodexThemeSeed {
	readonly id: CodexBuiltinThemeId;
	readonly name: string;
	/** Original theme background, except for terminal-adaptive deterministic web resolutions. */
	readonly background: CodexThemeHexColor;
	/** Original base text, except for terminal-adaptive deterministic web resolutions. */
	readonly foreground: CodexThemeHexColor;
	readonly accents: CodexThemeAccents;
	readonly terminalAdaptive: boolean;
	/** Preserves the upstream terminal semantics when RGB cannot represent them. */
	readonly terminalSource?: Readonly<{
		background: "terminal-default" | `ansi-index-${number}`;
		foreground: "terminal-default" | `ansi-index-${number}`;
	}>;
}

export const codexThemeSeeds = [
	{
		id: "1337",
		name: "1337",
		background: "#191919",
		foreground: "#F8F8F2",
		accents: ["#FDB082", "#FBE3BF", "#FF5E5E"],
		terminalAdaptive: false,
	},
	{
		id: "ansi",
		name: "ANSI",
		background: "#1E1E1E",
		foreground: "#D4D4D4",
		accents: ["#4EC9B0", "#C586C0", "#569CD6", "#DCDCAA"],
		terminalAdaptive: true,
		terminalSource: {
			background: "terminal-default",
			foreground: "terminal-default",
		},
	},
	{
		id: "base16",
		name: "Base16",
		background: "#181818",
		foreground: "#D8D8D8",
		accents: ["#AB4642", "#A1B56C", "#7CAFC2", "#BA8BAF"],
		terminalAdaptive: true,
		terminalSource: {
			background: "ansi-index-0",
			foreground: "ansi-index-7",
		},
	},
	{
		id: "base16-256",
		name: "Base16 256",
		background: "#121212",
		foreground: "#D0D0D0",
		accents: ["#D75F5F", "#87AF5F", "#5F87AF", "#AF87AF"],
		terminalAdaptive: true,
		terminalSource: {
			background: "ansi-index-0",
			foreground: "ansi-index-7",
		},
	},
	{
		id: "base16-eighties-dark",
		name: "Base16 Eighties Dark",
		background: "#2D2D2D",
		foreground: "#D3D0C8",
		accents: ["#F99157", "#99CC99", "#CC99CC"],
		terminalAdaptive: false,
	},
	{
		id: "base16-mocha-dark",
		name: "Base16 Mocha Dark",
		background: "#3B3228",
		foreground: "#D0C8C6",
		accents: ["#D28B71", "#BEB55B", "#A89BB9"],
		terminalAdaptive: false,
	},
	{
		id: "base16-ocean-dark",
		name: "Base16 Ocean Dark",
		background: "#2B303B",
		foreground: "#C0C5CE",
		accents: ["#D08770", "#A3BE8C", "#B48EAD"],
		terminalAdaptive: false,
	},
	{
		id: "base16-ocean-light",
		name: "Base16 Ocean Light",
		background: "#EFF1F5",
		foreground: "#4F5B66",
		accents: ["#D08770", "#A3BE8C", "#B48EAD"],
		terminalAdaptive: false,
	},
	{
		id: "catppuccin-frappe",
		name: "Catppuccin Frappé",
		background: "#303446",
		foreground: "#C6D0F5",
		accents: ["#A6D189", "#81C8BE", "#EF9F76", "#CA9EE6"],
		terminalAdaptive: false,
	},
	{
		id: "catppuccin-latte",
		name: "Catppuccin Latte",
		background: "#EFF1F5",
		foreground: "#4C4F69",
		accents: ["#40A02B", "#179299", "#FE640B", "#8839EF"],
		terminalAdaptive: false,
	},
	{
		id: "catppuccin-macchiato",
		name: "Catppuccin Macchiato",
		background: "#24273A",
		foreground: "#CAD3F5",
		accents: ["#A6DA95", "#8BD5CA", "#F5A97F", "#C6A0F6"],
		terminalAdaptive: false,
	},
	{
		id: "catppuccin-mocha",
		name: "Catppuccin Mocha",
		background: "#1E1E2E",
		foreground: "#CDD6F4",
		accents: ["#A6E3A1", "#94E2D5", "#FAB387", "#CBA6F7"],
		terminalAdaptive: false,
	},
	{
		id: "coldark-cold",
		name: "Coldark Cold",
		background: "#E3EAF2",
		foreground: "#111B27",
		accents: ["#116B00", "#A04900", "#755F00", "#005A8E"],
		terminalAdaptive: false,
	},
	{
		id: "coldark-dark",
		name: "Coldark Dark",
		background: "#111B27",
		foreground: "#E3EAF2",
		accents: ["#91D076", "#E9AE7E", "#E6D37A", "#6CB8E6"],
		terminalAdaptive: false,
	},
	{
		id: "dark-neon",
		name: "Dark Neon",
		background: "#000000",
		foreground: "#FFFFFF",
		accents: ["#CCFF66", "#FF73FD", "#66CCFF", "#99CC99"],
		terminalAdaptive: false,
	},
	{
		id: "dracula",
		name: "Dracula",
		background: "#282A36",
		foreground: "#F8F8F2",
		accents: ["#F1FA8C", "#FF79C6", "#BD93F9"],
		terminalAdaptive: false,
	},
	{
		id: "github",
		name: "GitHub",
		background: "#FFFFFF",
		foreground: "#333333",
		accents: ["#0086B3", "#183691", "#A71D5D"],
		terminalAdaptive: false,
	},
	{
		id: "gruvbox-dark",
		name: "Gruvbox Dark",
		background: "#282828",
		foreground: "#FBF1C7",
		accents: ["#D3869B", "#B8BB26", "#8EC07C", "#FB4934"],
		terminalAdaptive: false,
	},
	{
		id: "gruvbox-light",
		name: "Gruvbox Light",
		background: "#FBF1C7",
		foreground: "#282828",
		accents: ["#8F3F71", "#79740E", "#427B58", "#9D0006"],
		terminalAdaptive: false,
	},
	{
		id: "inspired-github",
		name: "Inspired GitHub",
		background: "#FFFFFF",
		foreground: "#323232",
		accents: ["#0086B3", "#183691", "#A71D5D"],
		terminalAdaptive: false,
	},
	{
		id: "monokai-extended",
		name: "Monokai Extended",
		background: "#222222",
		foreground: "#F8F8F2",
		accents: ["#BE84FF", "#E6DB74", "#F92672", "#A6E22E"],
		terminalAdaptive: false,
	},
	{
		id: "monokai-extended-bright",
		name: "Monokai Extended Bright",
		background: "#272822",
		foreground: "#F8F8F2",
		accents: ["#AE81FF", "#E6DB74", "#F92672", "#A6E22E"],
		terminalAdaptive: false,
	},
	{
		id: "monokai-extended-light",
		name: "Monokai Extended Light",
		background: "#FAFAFA",
		foreground: "#49483E",
		accents: ["#684D99", "#998F2F", "#F9005A", "#679900"],
		terminalAdaptive: false,
	},
	{
		id: "monokai-extended-origin",
		name: "Monokai Extended Origin",
		background: "#272822",
		foreground: "#F8F8F2",
		accents: ["#AE81FF", "#E6DB74", "#F92672", "#A6E22E"],
		terminalAdaptive: false,
	},
	{
		id: "nord",
		name: "Nord",
		background: "#2E3440",
		foreground: "#D8DEE9",
		accents: ["#A3BE8C", "#81A1C1", "#B48EAD", "#BF616A"],
		terminalAdaptive: false,
	},
	{
		id: "one-half-dark",
		name: "One Half Dark",
		background: "#282C34",
		foreground: "#DCDFE4",
		accents: ["#E5C07B", "#98C379", "#C678DD", "#61AFEF"],
		terminalAdaptive: false,
	},
	{
		id: "one-half-light",
		name: "One Half Light",
		background: "#FAFAFA",
		foreground: "#383A42",
		accents: ["#C18401", "#50A14F", "#A626A4", "#4078F2"],
		terminalAdaptive: false,
	},
	{
		id: "solarized-dark",
		name: "Solarized Dark",
		background: "#002B36",
		foreground: "#839496",
		accents: ["#2AA198", "#6C71C4", "#CB4B16", "#859900"],
		terminalAdaptive: false,
	},
	{
		id: "solarized-light",
		name: "Solarized Light",
		background: "#FDF6E3",
		foreground: "#657B83",
		accents: ["#2AA198", "#6C71C4", "#CB4B16", "#859900"],
		terminalAdaptive: false,
	},
	{
		id: "sublime-snazzy",
		name: "Sublime Snazzy",
		background: "#282A36",
		foreground: "#F8F8F2",
		accents: ["#F3F99D", "#FF5C57", "#5AF78E", "#57C7FF"],
		terminalAdaptive: false,
	},
	{
		id: "two-dark",
		name: "Two Dark",
		background: "#282C34",
		foreground: "#ABB2BF",
		accents: ["#D19A66", "#98C379", "#C678DD", "#61AFEF"],
		terminalAdaptive: false,
	},
	{
		id: "zenburn",
		name: "Zenburn",
		background: "#3F3F3F",
		foreground: "#DCDCCC",
		accents: ["#D68686", "#A0CFA1", "#87D6D5", "#FED6AF"],
		terminalAdaptive: false,
	},
] as const satisfies readonly CodexThemeSeed[];
