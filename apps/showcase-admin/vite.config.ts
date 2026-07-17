import { fileURLToPath } from "node:url";
import { cloudflare } from "@cloudflare/vite-plugin";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const source = (path: string): string =>
	fileURLToPath(new URL(`../../packages/${path}`, import.meta.url));

export default defineConfig({
	server: {
		allowedHosts: ["admin-showcase-ui-6502.le-mn.com", "host.docker.internal"],
	},
	resolve: {
		alias: [
			{
				find: "@lemn-ltd/provider-registry/manifest.json",
				replacement: source(
					"provider-registry/registry/provider-registry.v1.json",
				),
			},
			{
				find: "@lemn-ltd/provider-registry",
				replacement: source("provider-registry/src/index.ts"),
			},
			{
				find: "@lemn-ltd/brand-studio",
				replacement: source("brand-studio/src/index.ts"),
			},
			{
				find: "@lemn-ltd/brand-contract/system-brandings",
				replacement: source("brand-contract/src/system-brandings.ts"),
			},
			{
				find: "@lemn-ltd/brand-contract",
				replacement: source("brand-contract/src/index.ts"),
			},
			{
				find: "@lemn-ltd/ui/styles.css",
				replacement: source("ui/src/styles.css"),
			},
			{ find: "@lemn-ltd/ui", replacement: source("ui/src/index.ts") },
		],
	},
	build: { sourcemap: true },
	plugins: [react(), cloudflare({ inspectorPort: false })],
});
