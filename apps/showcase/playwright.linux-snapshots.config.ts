import { defineConfig } from "@playwright/test";
import canonicalConfig from "./playwright.config.ts";

const rawBaseUrl = process.env.SHOWCASE_LINUX_SNAPSHOT_BASE_URL;
if (!rawBaseUrl) {
	throw new Error("SHOWCASE_LINUX_SNAPSHOT_BASE_URL is required");
}

const baseUrl = new URL(rawBaseUrl);
if (baseUrl.protocol !== "http:") {
	throw new Error("SHOWCASE_LINUX_SNAPSHOT_BASE_URL must use http");
}
if (
	baseUrl.username ||
	baseUrl.password ||
	baseUrl.pathname !== "/" ||
	baseUrl.search ||
	baseUrl.hash
) {
	throw new Error("SHOWCASE_LINUX_SNAPSHOT_BASE_URL must be an HTTP origin");
}

const secureContextArgument = `--unsafely-treat-insecure-origin-as-secure=${baseUrl.origin}`;

export default defineConfig({
	...canonicalConfig,
	webServer: undefined,
	use: {
		...canonicalConfig.use,
		baseURL: baseUrl.href.replace(/\/$/u, ""),
		launchOptions: {
			...canonicalConfig.use?.launchOptions,
			args: [
				...(canonicalConfig.use?.launchOptions?.args ?? []),
				secureContextArgument,
			],
		},
	},
});
