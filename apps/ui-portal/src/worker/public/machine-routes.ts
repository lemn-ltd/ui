import { coreComponentExportsFromSlug } from "@lemn-ltd/ui/catalog/core";
import {
	blockCatalogProjection,
	CATALOG_MANIFEST,
	ENABLED_CATALOG_AREAS,
} from "../../catalog/catalog-manifest";
import { PROVIDER_READ_MODEL } from "../../provider-read-model";
import type { UiPortalEnv } from "../env";
import {
	cachedJson,
	cachedText,
	headAware,
	methodNotAllowed,
	publicResponse,
	withHeaders,
} from "../security/headers";
import type { RequestCorrelation } from "../security/request-correlation";

export function publicHealthResponse(
	request: Request,
	correlation: RequestCorrelation,
): Response {
	if (request.method !== "GET" && request.method !== "HEAD") {
		return publicResponse(methodNotAllowed(["GET", "HEAD"], correlation));
	}
	return headAware(
		request,
		publicResponse(
			withHeaders(Response.json({ ok: true, service: "ui-portal" }), {
				"cache-control": "no-store",
			}),
		),
	);
}

function catalogResponse(env: UiPortalEnv): Response {
	const blocks = blockCatalogProjection();
	return cachedJson({
		package: "@lemn-ltd/ui",
		version: env.BUILD_VERSION ?? "0.0.0",
		source: "https://github.com/lemn-ltd/ui",
		enabledAreas: ENABLED_CATALOG_AREAS,
		entries: CATALOG_MANIFEST,
		components: CATALOG_MANIFEST.filter((entry) => entry.kind === "component"),
		blocks,
		providerRegistry: {
			revision: PROVIDER_READ_MODEL.revision,
			capabilityCount: PROVIDER_READ_MODEL.capabilities.length,
		},
	});
}

function releaseResponse(env: UiPortalEnv): Response {
	return withHeaders(
		Response.json({
			package: "@lemn-ltd/ui",
			version: env.BUILD_VERSION ?? "0.0.0",
			gitSha: env.BUILD_GIT_SHA ?? "local",
			buildTime: env.BUILD_TIME ?? "local",
		}),
		{ "cache-control": "no-store" },
	);
}

function llmsResponse(): Response {
	return cachedText(
		[
			"# Lemn UI",
			"",
			"Use @lemn-ltd/ui as the official company design-system package.",
			"Import components only from the public package surface.",
			"",
			"Catalog:",
			"- JSON: https://portal.ui.le-mn.com/catalog.json",
			"- Provider provenance: https://portal.ui.le-mn.com/provider-registry.json",
			"- Curated blocks: https://portal.ui.le-mn.com/blocks.json",
			"- Full component guide: https://portal.ui.le-mn.com/llms-full.txt",
			"",
			"Rules:",
			"- Prefer existing catalog components before creating UI.",
			"- Do not deep-import package internals.",
			"- Do not import provider primitives directly in product apps.",
			"- Keep routing, authentication, data fetching, global state, and i18n outside the UI package.",
		].join("\n"),
	);
}

function llmsFullResponse(): Response {
	const lines = CATALOG_MANIFEST.flatMap((entry) => {
		const details = [
			`## ${entry.title}`,
			`kind: ${entry.kind}`,
			`slug: ${entry.slug}`,
			`group: ${entry.group}`,
			`status: ${entry.status}`,
			`url: https://portal.ui.le-mn.com${entry.path}`,
			`summary: ${entry.summary}`,
		];
		if (entry.kind === "component") {
			details.push(
				`import: import { ${coreComponentExportsFromSlug(entry.slug).join(", ")} } from '@lemn-ltd/ui';`,
			);
		}
		return [...details, ""];
	});
	return cachedText(["# Lemn UI Catalog", "", ...lines].join("\n"));
}

export function publicMachineResponse(
	request: Request,
	env: UiPortalEnv,
	pathname: string,
	correlation: RequestCorrelation,
): Response | undefined {
	if (
		pathname !== "/catalog.json" &&
		pathname !== "/release.json" &&
		pathname !== "/provider-registry.json" &&
		pathname !== "/blocks.json" &&
		pathname !== "/llms.txt" &&
		pathname !== "/llms-full.txt"
	) {
		return undefined;
	}
	if (request.method !== "GET" && request.method !== "HEAD") {
		return publicResponse(methodNotAllowed(["GET", "HEAD"], correlation));
	}

	let response: Response;
	switch (pathname) {
		case "/release.json":
			response = releaseResponse(env);
			break;
		case "/catalog.json":
			response = catalogResponse(env);
			break;
		case "/provider-registry.json":
			response = cachedJson(PROVIDER_READ_MODEL);
			break;
		case "/blocks.json":
			response = cachedJson({ blocks: blockCatalogProjection() });
			break;
		case "/llms.txt":
			response = llmsResponse();
			break;
		default:
			response = llmsFullResponse();
	}
	return headAware(request, publicResponse(response));
}
