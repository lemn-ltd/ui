import { defineConfig } from "@playwright/test";
import canonicalConfig from "./playwright.config.ts";

const rawBaseUrl = process.env.SHOWCASE_LINUX_SNAPSHOT_BASE_URL;
if (!rawBaseUrl) {
	throw new Error("SHOWCASE_LINUX_SNAPSHOT_BASE_URL is required");
}

const baseUrl = new URL(rawBaseUrl);
if (
	baseUrl.protocol !== "http:" ||
	baseUrl.hostname !== "127.0.0.1" ||
	!baseUrl.port ||
	rawBaseUrl !== baseUrl.origin ||
	baseUrl.username ||
	baseUrl.password ||
	baseUrl.pathname !== "/" ||
	baseUrl.search ||
	baseUrl.hash
) {
	throw new Error(
		"SHOWCASE_LINUX_SNAPSHOT_BASE_URL must be an exact HTTP loopback origin like http://127.0.0.1:45678",
	);
}

export default defineConfig({
	...canonicalConfig,
	retries: 0,
	webServer: undefined,
	use: {
		...canonicalConfig.use,
		baseURL: baseUrl.origin,
	},
});
