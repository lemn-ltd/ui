import type { APIRoute } from "astro";

export const prerender = true;

export const GET: APIRoute = () =>
	new Response(
		JSON.stringify({
			package: "@lemn-ltd/ui",
			version: import.meta.env.PUBLIC_BUILD_VERSION ?? "local",
			gitSha: import.meta.env.PUBLIC_BUILD_GIT_SHA ?? "local",
			buildTime: import.meta.env.PUBLIC_BUILD_TIME ?? "local",
		}),
		{
			headers: {
				"cache-control": "no-cache",
				"content-type": "application/json; charset=utf-8",
			},
		},
	);
