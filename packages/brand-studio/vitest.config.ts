import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "happy-dom",
    include: ["src/tests/**/*.spec.ts", "src/tests/**/*.spec.tsx"]
  }
});
