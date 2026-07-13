import { WorkerEntrypoint } from "cloudflare:workers";
import {
	componentCatalog,
	componentExportsFromSlug,
} from "@lemn-ltd/ui/catalog";
import type { UiShowcaseEnv } from "./env";
import { buildStatusReport, validateUiShowcaseEnv } from "./service-descriptor";

export default class UiShowcaseWorker extends WorkerEntrypoint<UiShowcaseEnv> {
	override async fetch(request: Request): Promise<Response> {
		const env = this.env;
		const pathname = new URL(request.url).pathname;

		if (pathname === "/health") return healthResponse(env);
		if (pathname === "/health/ready") return readyResponse(env);
		if (pathname === "/catalog.json") return catalogResponse(env);
		if (pathname === "/llms.txt") return llmsResponse();
		if (pathname === "/llms-full.txt") return llmsFullResponse();

		if (
			pathname === "/_status" ||
			pathname === "/_status.json" ||
			pathname === "/health/deep"
		) {
			return protectedStatusResponse(request, env);
		}

		if (env.ASSETS) return env.ASSETS.fetch(request);

		return readinessFailureResponse(env);
	}
}

function readinessFailureResponse(env: UiShowcaseEnv): Response {
	const validation = validateUiShowcaseEnv(env);
	return Response.json(
		{
			error: "service_not_ready",
			code: "ui_showcase_configuration_not_ready",
			missingBindings: validation.missingBindings,
			missingConfiguration: validation.missingConfiguration,
		},
		{ status: 503 },
	);
}

function healthResponse(env: UiShowcaseEnv): Response {
	return Response.json({
		ok: true,
		service: "ui-showcase",
		environment: env.DEPLOYMENT_ENVIRONMENT ?? "local",
		version: env.BUILD_VERSION ?? "0.0.0",
		gitSha: env.BUILD_GIT_SHA ?? "local",
		buildTime: env.BUILD_TIME ?? "local",
	});
}

function readyResponse(env: UiShowcaseEnv): Response {
	const validation = validateUiShowcaseEnv(env);
	return Response.json(
		{
			ok: validation.ready,
			service: "ui-showcase",
			environment: env.DEPLOYMENT_ENVIRONMENT ?? "local",
			version: env.BUILD_VERSION ?? "0.0.0",
			gitSha: env.BUILD_GIT_SHA ?? "local",
			missingBindings: validation.missingBindings,
			missingConfiguration: validation.missingConfiguration,
		},
		{ status: validation.ready ? 200 : 503 },
	);
}

function protectedStatusResponse(
	request: Request,
	env: UiShowcaseEnv,
): Response {
	if (!isAuthorized(request, env)) {
		return Response.json({ error: "unauthorized" }, { status: 401 });
	}

	return Response.json(buildStatusReport(env));
}

function isAuthorized(request: Request, env: UiShowcaseEnv): boolean {
	if (!env.STATUS_TOKEN) return env.DEPLOYMENT_ENVIRONMENT !== "production";

	const authorization = request.headers.get("authorization");
	if (authorization === `Bearer ${env.STATUS_TOKEN}`) return true;

	return new URL(request.url).searchParams.get("token") === env.STATUS_TOKEN;
}

function catalogResponse(env: UiShowcaseEnv): Response {
	return Response.json({
		package: "@lemn-ltd/ui",
		version: env.BUILD_VERSION ?? "0.0.0",
		source: "https://github.com/lemn-ltd/ui",
		components: componentCatalog,
	});
}

function llmsResponse(): Response {
	return new Response(
		[
			"# LEMN UI",
			"",
			"Use @lemn-ltd/ui as the official company design-system package.",
			"Import components only from the public package surface.",
			"",
			"Catalog:",
			"- JSON: https://showcase.ui.lemn.ai/catalog.json",
			"- Full agent guide: https://showcase.ui.lemn.ai/llms-full.txt",
			"",
			"Rules:",
			"- Prefer existing catalog components before creating UI.",
			"- Do not deep-import package internals.",
			"- Do not import Radix, cmdk, or sonner directly in product apps.",
			"- If a reusable component is missing, add it to @lemn-ltd/ui and document it in the showcase.",
		].join("\n"),
		{ headers: { "content-type": "text/plain; charset=utf-8" } },
	);
}

function llmsFullResponse(): Response {
	const lines = componentCatalog.flatMap((entry) => [
		`## ${entry.title}`,
		`slug: ${entry.slug}`,
		`group: ${entry.group}`,
		`status: ${entry.status}`,
		`intent: ${entry.intent}`,
		`import: import { ${componentExportsFromSlug(entry.slug).join(", ")} } from '@lemn-ltd/ui';`,
		"",
	]);

	return new Response(
		["# LEMN UI Component Catalog", "", ...lines].join("\n"),
		{
			headers: { "content-type": "text/plain; charset=utf-8" },
		},
	);
}
