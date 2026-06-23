import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  esbuild: { jsx: "automatic" },
  plugins: [react()],
  test: {
    environment: "happy-dom",
    include: ["src/**/*.spec.tsx", "src/**/*.spec.ts"],
    setupFiles: ["./vitest.setup.ts"],
    mockReset: true,
    restoreMocks: true,
    clearMocks: true,
  },
});
