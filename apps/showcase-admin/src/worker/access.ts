import { createRemoteJWKSet, type JWTPayload, jwtVerify } from "jose";
import type { ShowcaseAdminEnv } from "./env";

const ACCESS_EMAIL = "cf-access-authenticated-user-email";
const ACCESS_ASSERTION = "cf-access-jwt-assertion";

export interface HumanAccessIdentity {
	readonly kind: "human";
	readonly email: string;
	readonly assertion: string;
}

export interface ServiceAccessIdentity {
	readonly kind: "service";
	readonly serviceTokenId: string;
	readonly assertion: string;
}

export type AccessIdentity = HumanAccessIdentity | ServiceAccessIdentity;

export type AccessVerifier = (
	assertion: string,
	configuration: { readonly issuer: string; readonly audience: string },
) => Promise<JWTPayload>;

const remoteKeySets = new Map<string, ReturnType<typeof createRemoteJWKSet>>();

async function verifyRemote(
	assertion: string,
	configuration: { readonly issuer: string; readonly audience: string },
): Promise<JWTPayload> {
	const certs = new URL("/cdn-cgi/access/certs", configuration.issuer);
	let keySet = remoteKeySets.get(certs.href);
	if (!keySet) {
		keySet = createRemoteJWKSet(certs, {
			cacheMaxAge: 10 * 60 * 1_000,
			cooldownDuration: 30 * 1_000,
			timeoutDuration: 5 * 1_000,
		});
		remoteKeySets.set(certs.href, keySet);
	}
	const verified = await jwtVerify(assertion, keySet, {
		issuer: configuration.issuer,
		audience: configuration.audience,
		algorithms: ["RS256"],
		clockTolerance: 10,
		requiredClaims: ["iss", "aud", "sub", "iat", "exp"],
	});
	return verified.payload;
}

function accessConfiguration(
	request: Request,
	env: ShowcaseAdminEnv,
): {
	readonly issuer: string;
	readonly audience: string;
} {
	const issuer = env.ACCESS_ISSUER?.trim().replace(/\/$/u, "");
	const url = new URL(request.url);
	const usesProductionHealthApplication =
		env.DEPLOYMENT_ENVIRONMENT === "production" &&
		request.method === "GET" &&
		url.pathname === "/health";
	const audience = (
		usesProductionHealthApplication
			? env.ACCESS_HEALTH_AUDIENCE
			: env.ACCESS_AUDIENCE
	)?.trim();
	if (!issuer || !audience || !issuer.endsWith(".cloudflareaccess.com")) {
		throw new Error("Cloudflare Access verification is not configured.");
	}
	return { issuer, audience };
}

export async function accessIdentity(
	request: Request,
	env: ShowcaseAdminEnv,
	verify: AccessVerifier = verifyRemote,
): Promise<AccessIdentity | undefined> {
	const headerEmail = request.headers.get(ACCESS_EMAIL)?.trim().toLowerCase();
	const assertion = request.headers.get(ACCESS_ASSERTION)?.trim();
	if (!assertion) return undefined;
	const payload = await verify(assertion, accessConfiguration(request, env));
	const tokenEmail =
		typeof payload.email === "string"
			? payload.email.trim().toLowerCase()
			: undefined;
	const subject =
		typeof payload.sub === "string" ? payload.sub.trim() : undefined;
	const serviceTokenId =
		typeof payload.common_name === "string"
			? payload.common_name.trim().toLowerCase()
			: undefined;
	if (tokenEmail) {
		if (
			!headerEmail ||
			tokenEmail !== headerEmail ||
			!subject ||
			serviceTokenId
		) {
			throw new Error("Cloudflare Access identity is invalid.");
		}
		return { kind: "human", email: tokenEmail, assertion };
	}
	if (
		headerEmail ||
		subject !== "" ||
		!serviceTokenId ||
		!serviceTokenId.endsWith(".access")
	) {
		throw new Error("Cloudflare Access identity is invalid.");
	}
	return { kind: "service", serviceTokenId, assertion };
}

export function accessHeaders(identity: AccessIdentity | undefined): Headers {
	const headers = new Headers({ "content-type": "application/json" });
	if (identity?.kind === "service") {
		throw new Error(
			"Service-token identities cannot call business capabilities.",
		);
	}
	if (identity?.kind === "human") {
		headers.set(ACCESS_EMAIL, identity.email);
		headers.set(ACCESS_ASSERTION, identity.assertion);
	}
	return headers;
}
