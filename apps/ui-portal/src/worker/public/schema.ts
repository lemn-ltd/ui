import {
	BRANDING_DEFINITION_SCHEMA_URL,
	brandingDefinitionJsonSchema,
} from "@lemn-ltd/brand-contract";
import {
	headAware,
	methodNotAllowed,
	publicResponse,
} from "../security/headers";
import {
	type RequestCorrelation,
	requestProblem,
} from "../security/request-correlation";

export function brandingSchemaResponse(
	request: Request,
	pathname: string,
	correlation: RequestCorrelation,
): Response {
	if (pathname !== "/branding/v1.json") {
		return publicResponse(
			requestProblem(correlation, {
				status: 404,
				title: "Schema unavailable",
				detail: "The requested schema resource does not exist.",
				code: "schema-unavailable",
			}),
		);
	}
	if (request.method !== "GET" && request.method !== "HEAD") {
		return publicResponse(methodNotAllowed(["GET", "HEAD"], correlation));
	}

	const headers = new Headers({
		"access-control-allow-origin": "*",
		"cache-control": "public, max-age=31536000, immutable",
		"content-type": "application/schema+json; charset=utf-8",
		"x-content-type-options": "nosniff",
	});
	const response = new Response(
		JSON.stringify({
			...brandingDefinitionJsonSchema,
			$id: BRANDING_DEFINITION_SCHEMA_URL,
		}),
		{ headers },
	);
	return headAware(request, response);
}
