import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@lemn-ltd/provider-registry/manifest.json": path.resolve(import.meta.dirname, "../../packages/provider-registry/registry/provider-registry.v1.json"),
      "@lemn-ltd/provider-registry": path.resolve(import.meta.dirname, "../../packages/provider-registry/src/index.ts"),
      "@lemn-ltd/brand-contract": path.resolve(import.meta.dirname, "../../packages/brand-contract/src/index.ts"),
      "cloudflare:workers": path.resolve(import.meta.dirname, "tests/fixtures/cloudflare-workers.ts"),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "tests/unit/**/*.spec.ts"],
  },
});
