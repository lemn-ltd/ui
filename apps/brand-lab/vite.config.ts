import { cloudflare } from "@cloudflare/vite-plugin";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
	server: {
		allowedHosts: ["brand-lab-6501.le-mn.com"],
	},
	build: {
		outDir: "dist/client",
		sourcemap: true,
	},
	plugins: [react(), cloudflare({ inspectorPort: false })],
});
