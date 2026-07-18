import { fileURLToPath } from "node:url";
import { cloudflare } from "@cloudflare/vite-plugin";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { uiPortalAppDescriptor } from "./src/app-descriptor";

const localUiOnly = process.env.WEB_UI_LOCAL === "1";

const uiSrc = (relativePath: string): string =>
	fileURLToPath(
		new URL(`../../packages/ui/src/${relativePath}`, import.meta.url),
	);
const catalogKitSrc = (relativePath: string): string =>
	fileURLToPath(
		new URL(`./src/client/shared/catalog-kit/${relativePath}`, import.meta.url),
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
		allowedHosts: ["ui-portal-6500.le-mn.com", "host.docker.internal"],
	},
	// The portal consumes @lemn-ltd/ui from source so the catalog stays the
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
			{
				find: "@lemn-ltd/ui/blocks/core/catalog",
				replacement: uiSrc("blocks/core-block-catalog.ts"),
			},
			{
				find: "@lemn-ltd/ui/blocks/core",
				replacement: uiSrc("blocks/core.ts"),
			},
			{ find: "@lemn-ltd/ui/blocks", replacement: uiSrc("blocks/index.ts") },
			{
				find: "@lemn-ltd/ui/catalog/core",
				replacement: uiSrc("catalog-core.ts"),
			},
			{ find: "@lemn-ltd/ui/catalog", replacement: uiSrc("catalog.ts") },
			{ find: "@lemn-ltd/ui/tokens", replacement: uiSrc("tokens.ts") },
			{ find: "@lemn-ltd/ui", replacement: uiSrc("index.ts") },
			{
				find: "@portal/catalog-kit",
				replacement: catalogKitSrc("index.ts"),
			},
		],
	},
	build: {
		cssCodeSplit: true,
		sourcemap: true,
		rollupOptions: {
			output: {
				assetFileNames: (asset) =>
					asset.names.some((name) => name.includes("admin"))
						? "admin-assets/[name]-[hash][extname]"
						: "assets/[name]-[hash][extname]",
				chunkFileNames: (chunk) =>
					chunk.name.startsWith("admin") ||
					chunk.facadeModuleId?.includes("/src/client/modules/admin/")
						? "admin-assets/[name]-[hash].js"
						: "assets/[name]-[hash].js",
			},
		},
	},
	plugins: [
		{
			name: "lemn-ui-html",
			transformIndexHtml(html) {
				return html.replace(/%APP_NAME%/g, uiPortalAppDescriptor.displayName);
			},
		},
		react(),
		!localUiOnly && cloudflare({ inspectorPort: false }),
	],
});
