import { fileURLToPath } from "node:url";
import { cloudflare } from "@cloudflare/vite-plugin";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { uiShowcaseAppDescriptor } from "./src/app-descriptor";

const localUiOnly = process.env.WEB_UI_LOCAL === "1";

const uiSrc = (relativePath: string): string =>
	fileURLToPath(
		new URL(`../../packages/ui/src/${relativePath}`, import.meta.url),
	);
const showcaseKitSrc = (relativePath: string): string =>
	fileURLToPath(
		new URL(`../../packages/showcase-kit/src/${relativePath}`, import.meta.url),
	);
const brandContractSrc = (relativePath: string): string =>
	fileURLToPath(
		new URL(
			`../../packages/brand-contract/src/${relativePath}`,
			import.meta.url,
		),
	);
const brandStudioSrc = (relativePath: string): string =>
	fileURLToPath(
		new URL(`../../packages/brand-studio/src/${relativePath}`, import.meta.url),
	);
const providerRegistrySrc = (relativePath: string): string =>
	fileURLToPath(
		new URL(
			`../../packages/provider-registry/${relativePath}`,
			import.meta.url,
		),
	);

export default defineConfig({
	server: {
		allowedHosts: ["showcase-ui-6500.le-mn.com", "host.docker.internal"],
	},
	// The showcase consumes @lemn-ltd/ui from source so the catalog stays the
	// single visual source of truth without a rebuild on every change.
	resolve: {
		alias: [
			{
				find: "@lemn-ltd/provider-registry/manifest.json",
				replacement: providerRegistrySrc("registry/provider-registry.v1.json"),
			},
			{
				find: "@lemn-ltd/provider-registry",
				replacement: providerRegistrySrc("src/index.ts"),
			},
			{
				find: "@lemn-ltd/brand-studio",
				replacement: brandStudioSrc("index.ts"),
			},
			{
				find: "@lemn-ltd/brand-contract/system-brandings",
				replacement: brandContractSrc("system-brandings.ts"),
			},
			{
				find: "@lemn-ltd/brand-contract",
				replacement: brandContractSrc("index.ts"),
			},
			{ find: "@lemn-ltd/ui/styles.css", replacement: uiSrc("styles.css") },
			{ find: "@lemn-ltd/ui/catalog", replacement: uiSrc("catalog.ts") },
			{ find: "@lemn-ltd/ui/tokens", replacement: uiSrc("tokens.ts") },
			{ find: "@lemn-ltd/ui", replacement: uiSrc("index.ts") },
			{
				find: "@lemn-ltd/showcase-kit/styles.css",
				replacement: showcaseKitSrc("styles.css"),
			},
			{
				find: "@lemn-ltd/showcase-kit",
				replacement: showcaseKitSrc("index.ts"),
			},
		],
	},
	build: {
		sourcemap: true,
	},
	plugins: [
		{
			name: "lemn-ui-html",
			transformIndexHtml(html) {
				return html.replace(/%APP_NAME%/g, uiShowcaseAppDescriptor.displayName);
			},
		},
		react(),
		!localUiOnly && cloudflare({ inspectorPort: false }),
	],
});
