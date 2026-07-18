import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
	esbuild: { jsx: "automatic" },
	plugins: [react()],
	resolve: {
		alias: {
			"@portal/catalog-kit": path.resolve(
				import.meta.dirname,
				"src/client/shared/catalog-kit/index.ts",
			),
			"@lemn-ltd/brand-contract/system-brandings": path.resolve(
				import.meta.dirname,
				"../../packages/brand-contract/src/system-brandings.ts",
			),
			"@lemn-ltd/brand-contract": path.resolve(
				import.meta.dirname,
				"../../packages/brand-contract/src/index.ts",
			),
			"@lemn-ltd/brand-studio": path.resolve(
				import.meta.dirname,
				"../../packages/brand-studio/src/index.ts",
			),
			"@lemn-ltd/provider-registry/manifest.json": path.resolve(
				import.meta.dirname,
				"../../packages/provider-registry/registry/provider-registry.v1.json",
			),
			"@lemn-ltd/provider-registry": path.resolve(
				import.meta.dirname,
				"../../packages/provider-registry/src/index.ts",
			),
			"@lemn-ltd/ui/styles.css": path.resolve(
				import.meta.dirname,
				"../../packages/ui/src/styles.css",
			),
			"@lemn-ltd/ui/blocks/core/catalog": path.resolve(
				import.meta.dirname,
				"../../packages/ui/src/blocks/core-block-catalog.ts",
			),
			"@lemn-ltd/ui/blocks/core": path.resolve(
				import.meta.dirname,
				"../../packages/ui/src/blocks/core.ts",
			),
			"@lemn-ltd/ui/blocks": path.resolve(
				import.meta.dirname,
				"../../packages/ui/src/blocks/index.ts",
			),
			"@lemn-ltd/ui/catalog/core": path.resolve(
				import.meta.dirname,
				"../../packages/ui/src/catalog-core.ts",
			),
			"@lemn-ltd/ui/catalog": path.resolve(
				import.meta.dirname,
				"../../packages/ui/src/catalog.ts",
			),
			"@lemn-ltd/ui/tokens": path.resolve(
				import.meta.dirname,
				"../../packages/ui/src/tokens.ts",
			),
			"@lemn-ltd/ui": path.resolve(
				import.meta.dirname,
				"../../packages/ui/src/index.ts",
			),
			"cloudflare:workers": path.resolve(
				import.meta.dirname,
				"tests/fixtures/cloudflare-workers.ts",
			),
		},
	},
	test: {
		environment: "node",
		include: [
			"tests/unit/**/*.spec.ts",
			"tests/unit/**/*.spec.tsx",
		],
		mockReset: true,
		restoreMocks: true,
		clearMocks: true,
	},
});
