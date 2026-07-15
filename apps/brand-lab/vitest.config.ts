import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
	esbuild: { jsx: "automatic" },
	plugins: [react()],
	test: {
		environment: "node",
		include: ["tests/unit/**/*.spec.ts", "tests/unit/**/*.spec.tsx"],
		clearMocks: true,
		mockReset: true,
		restoreMocks: true,
	},
});
