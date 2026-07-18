import {
	createRemoteJWKSet,
	type JWTPayload,
	type JWTVerifyGetKey,
	jwtVerify,
} from "jose";
import type { UiPortalEnv } from "./env";

const ACCESS_EMAIL = "cf-access-authenticated-user-email";
const ACCESS_ASSERTION = "cf-access-jwt-assertion";
const ACCESS_ISSUER_SUFFIX = ".cloudflareaccess.com";
const ACCESS_AUDIENCE_PATTERN = /^[0-9a-f]{64}$/iu;

export type AccessPurpose = "admin" | "health";

export interface HumanAccessIdentity {
	readonly kind: "human";
	readonly email: string;
	readonly role: "portal-admin";
	readonly subject: string;
}

export interface ServiceAccessIdentity {
	readonly kind: "service";
	readonly serviceTokenId: string;
}

export type AccessIdentity = HumanAccessIdentity | ServiceAccessIdentity;

export interface AccessVerificationConfiguration {
	readonly issuer: string;
	readonly audience: string | readonly string[];
}

export type AccessVerifier = (
	assertion: string,
	configuration: AccessVerificationConfiguration,
) => Promise<JWTPayload>;

const remoteKeySets = new Map<string, ReturnType<typeof createRemoteJWKSet>>();

/**
 * Verifies the complete Access application-token contract. Tests may provide a
 * local key resolver; production always resolves the account keys from the
 * configured Cloudflare Access issuer.
 */
export async function verifyAccessAssertion(
	assertion: string,
	configuration: AccessVerificationConfiguration,
	resolveKey?: JWTVerifyGetKey,
): Promise<JWTPayload> {
	let keySet: JWTVerifyGetKey;
	if (resolveKey) {
		keySet = resolveKey;
	} else {
		const certs = new URL("/cdn-cgi/access/certs", configuration.issuer);
		let remoteKeySet = remoteKeySets.get(certs.href);
		if (!remoteKeySet) {
			remoteKeySet = createRemoteJWKSet(certs, {
				cacheMaxAge: 10 * 60 * 1_000,
				cooldownDuration: 30 * 1_000,
				timeoutDuration: 5 * 1_000,
			});
			remoteKeySets.set(certs.href, remoteKeySet);
		}
		keySet = remoteKeySet;
	}
	const verified = await jwtVerify(assertion, keySet, {
		issuer: configuration.issuer,
		audience: [
			...(Array.isArray(configuration.audience)
				? configuration.audience
				: [configuration.audience]),
		],
		algorithms: ["RS256"],
		clockTolerance: 10,
		requiredClaims: ["iss", "aud", "sub", "iat", "exp"],
	});
	if (verified.payload.type !== "app") {
		throw new Error("Cloudflare Access application token is required.");
	}
	return verified.payload;
}

function configuredAudiences(value: string | undefined): readonly string[] {
	return (value ?? "")
		.split(",")
		.map((audience) => audience.trim())
		.filter(Boolean);
}

function validAccessIssuer(value: string | undefined): value is string {
	if (!value) return false;
	try {
		const issuer = new URL(value);
		return (
			issuer.protocol === "https:" &&
			issuer.hostname.endsWith(ACCESS_ISSUER_SUFFIX) &&
			issuer.pathname === "/" &&
			!issuer.search &&
			!issuer.hash
		);
	} catch {
		return false;
	}
}

export function accessConfiguration(
	env: UiPortalEnv,
	purpose: AccessPurpose,
): AccessVerificationConfiguration {
	const issuer = env.ACCESS_ISSUER?.trim().replace(/\/$/u, "");
	const audiences = configuredAudiences(
		purpose === "health" ? env.ACCESS_HEALTH_AUDIENCE : env.ACCESS_AUDIENCE,
	);
	const audience =
		audiences.length === 1
			? audiences.at(0)
			: audiences.length > 1
				? audiences
				: undefined;
	if (
		!validAccessIssuer(issuer) ||
		!audience ||
		!audiences.every((value) => ACCESS_AUDIENCE_PATTERN.test(value))
	) {
		throw new Error("Cloudflare Access verification is not configured.");
	}
	return {
		issuer,
		audience,
	};
}

/**
 * Validates the Access assertion at the origin and returns only a normalized
 * identity. The signed token itself is deliberately never returned to callers.
 */
export async function accessIdentity(
	request: Request,
	env: UiPortalEnv,
	purpose: AccessPurpose,
	verify: AccessVerifier = verifyAccessAssertion,
): Promise<AccessIdentity | undefined> {
	const headerEmail = request.headers.get(ACCESS_EMAIL)?.trim().toLowerCase();
	const assertion = request.headers.get(ACCESS_ASSERTION)?.trim();
	if (!assertion) return undefined;

	const payload = await verify(assertion, accessConfiguration(env, purpose));
	if (payload.type !== "app") {
		throw new Error("Cloudflare Access application token is required.");
	}
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
		return {
			kind: "human",
			email: tokenEmail,
			role: "portal-admin",
			subject,
		};
	}

	if (
		headerEmail ||
		subject !== "" ||
		!serviceTokenId ||
		!serviceTokenId.endsWith(".access")
	) {
		throw new Error("Cloudflare Access identity is invalid.");
	}
	return { kind: "service", serviceTokenId };
}

export function localAdminIdentity(): HumanAccessIdentity {
	return {
		kind: "human",
		email: "local-development@ui.le-mn.com",
		role: "portal-admin",
		subject: "local-development",
	};
}
