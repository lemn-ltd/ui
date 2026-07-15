import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";
import type { ShowcaseAdminEnv } from "./env";

const ACCESS_EMAIL = "cf-access-authenticated-user-email";
const ACCESS_ASSERTION = "cf-access-jwt-assertion";

export interface AccessIdentity {
	readonly email: string;
	readonly assertion: string;
}

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
		requiredClaims: ["iss", "aud", "sub", "iat", "exp", "email"],
	});
	return verified.payload;
}

function accessConfiguration(env: ShowcaseAdminEnv): { readonly issuer: string; readonly audience: string } {
	const issuer = env.ACCESS_ISSUER?.trim().replace(/\/$/u, "");
	const audience = env.ACCESS_AUDIENCE?.trim();
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
	if (!headerEmail || !assertion) return undefined;
	const payload = await verify(assertion, accessConfiguration(env));
	const tokenEmail = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : undefined;
	if (!tokenEmail || tokenEmail !== headerEmail) throw new Error("Cloudflare Access identity is invalid.");
	return { email: tokenEmail, assertion };
}

export function accessHeaders(identity: AccessIdentity | undefined): Headers {
	const headers = new Headers({ "content-type": "application/json" });
	if (identity) {
		headers.set(ACCESS_EMAIL, identity.email);
		headers.set(ACCESS_ASSERTION, identity.assertion);
	}
	return headers;
}
