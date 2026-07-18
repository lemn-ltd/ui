import { generateKeyPair, SignJWT } from "jose";
import { describe, expect, it, vi } from "vitest";
import {
	type AccessVerifier,
	accessConfiguration,
	accessIdentity,
	verifyAccessAssertion,
} from "../../../src/worker/access";
import type { UiPortalEnv } from "../../../src/worker/env";

const ADMIN_AUDIENCE_ONE = "a".repeat(64);
const ADMIN_AUDIENCE_TWO = "b".repeat(64);
const HEALTH_AUDIENCE = "c".repeat(64);

const ENV: UiPortalEnv = {
	ACCESS_AUDIENCE: `${ADMIN_AUDIENCE_ONE}, ${ADMIN_AUDIENCE_TWO}`,
	ACCESS_HEALTH_AUDIENCE: HEALTH_AUDIENCE,
	ACCESS_ISSUER: "https://lemn-dev.cloudflareaccess.com/",
	DEPLOYMENT_ENVIRONMENT: "production",
};

function request(email?: string, assertion?: string): Request {
	const headers = new Headers();
	if (email) headers.set("cf-access-authenticated-user-email", email);
	if (assertion) headers.set("cf-access-jwt-assertion", assertion);
	return new Request("https://portal.ui.le-mn.com/admin", { headers });
}

describe("Cloudflare Access origin validation", () => {
	it("cryptographically enforces RS256 signature, issuer, audience, expiry, and required claims", async () => {
		const now = Math.floor(Date.now() / 1_000);
		const trusted = await generateKeyPair("RS256");
		const untrusted = await generateKeyPair("RS256");
		const configuration = accessConfiguration(ENV, "admin");
		const token = async (
			overrides: {
				readonly audience?: string;
				readonly expiresAt?: number;
				readonly issuer?: string;
				readonly privateKey?: CryptoKey;
				readonly subject?: string;
				readonly type?: string;
			} = {},
		): Promise<string> => {
			let jwt = new SignJWT({
				email: "owner@lemn.test",
				type: overrides.type ?? "app",
			})
				.setProtectedHeader({ alg: "RS256", kid: "access-test" })
				.setIssuer(overrides.issuer ?? configuration.issuer)
				.setAudience(overrides.audience ?? ADMIN_AUDIENCE_ONE)
				.setIssuedAt(now)
				.setExpirationTime(overrides.expiresAt ?? now + 60);
			if (overrides.subject !== "") {
				jwt = jwt.setSubject(overrides.subject ?? "access-user");
			}
			return jwt.sign(overrides.privateKey ?? trusted.privateKey);
		};
		const resolveTrustedKey = async () => trusted.publicKey;

		await expect(
			verifyAccessAssertion(await token(), configuration, resolveTrustedKey),
		).resolves.toMatchObject({
			aud: ADMIN_AUDIENCE_ONE,
			email: "owner@lemn.test",
			iss: configuration.issuer,
			sub: "access-user",
		});

		for (const invalid of [
			await token({ issuer: "https://other.cloudflareaccess.com" }),
			await token({ audience: "d".repeat(64) }),
			await token({ expiresAt: now - 60 }),
			await token({ privateKey: untrusted.privateKey }),
			await token({ subject: "" }),
			await token({ type: "org" }),
		]) {
			await expect(
				verifyAccessAssertion(invalid, configuration, resolveTrustedKey),
			).rejects.toBeDefined();
		}
	});

	it("normalizes one issuer, an Admin audience set, and separate health audience", () => {
		expect(accessConfiguration(ENV, "admin")).toEqual({
			issuer: "https://lemn-dev.cloudflareaccess.com",
			audience: [ADMIN_AUDIENCE_ONE, ADMIN_AUDIENCE_TWO],
		});
		expect(accessConfiguration(ENV, "health")).toEqual({
			issuer: "https://lemn-dev.cloudflareaccess.com",
			audience: HEALTH_AUDIENCE,
		});
	});

	it("does not trust an unsigned email header", async () => {
		const verifier = vi.fn<AccessVerifier>();
		await expect(
			accessIdentity(request("owner@lemn.test"), ENV, "admin", verifier),
		).resolves.toBeUndefined();
		expect(verifier).not.toHaveBeenCalled();
	});

	it("returns only a normalized human identity proven by signed claims", async () => {
		const verifier = vi.fn<AccessVerifier>().mockResolvedValue({
			iss: "https://lemn-dev.cloudflareaccess.com",
			aud: ADMIN_AUDIENCE_ONE,
			sub: "access-user",
			email: "owner@lemn.test",
			iat: 1,
			exp: 2,
			type: "app",
		});
		await expect(
			accessIdentity(
				request("OWNER@LEMN.TEST", "signed-access-jwt"),
				ENV,
				"admin",
				verifier,
			),
		).resolves.toEqual({
			kind: "human",
			email: "owner@lemn.test",
			role: "portal-admin",
			subject: "access-user",
		});
		expect(verifier).toHaveBeenCalledWith("signed-access-jwt", {
			issuer: "https://lemn-dev.cloudflareaccess.com",
			audience: [ADMIN_AUDIENCE_ONE, ADMIN_AUDIENCE_TWO],
		});
	});

	it("returns a distinct service identity only from service-token claims", async () => {
		const verifier = vi.fn<AccessVerifier>().mockResolvedValue({
			iss: "https://lemn-dev.cloudflareaccess.com",
			aud: HEALTH_AUDIENCE,
			sub: "",
			common_name: "88BF3B6D86161464F6509F7219099E57.access",
			iat: 1,
			exp: 2,
			type: "app",
		});
		await expect(
			accessIdentity(
				request(undefined, "signed-service-jwt"),
				ENV,
				"health",
				verifier,
			),
		).resolves.toEqual({
			kind: "service",
			serviceTokenId: "88bf3b6d86161464f6509f7219099e57.access",
		});
		expect(verifier).toHaveBeenCalledWith("signed-service-jwt", {
			issuer: "https://lemn-dev.cloudflareaccess.com",
			audience: HEALTH_AUDIENCE,
		});
	});

	it("rejects a spoofed human header and mixed human/service claims", async () => {
		const spoofedEmail = vi.fn<AccessVerifier>().mockResolvedValue({
			sub: "access-user",
			email: "other@lemn.test",
			type: "app",
		});
		await expect(
			accessIdentity(
				request("owner@lemn.test", "signed-access-jwt"),
				ENV,
				"admin",
				spoofedEmail,
			),
		).rejects.toThrow("Cloudflare Access identity is invalid");

		const mixedClaims = vi.fn<AccessVerifier>().mockResolvedValue({
			sub: "access-user",
			email: "owner@lemn.test",
			common_name: "service.access",
			type: "app",
		});
		await expect(
			accessIdentity(
				request("owner@lemn.test", "signed-access-jwt"),
				ENV,
				"admin",
				mixedClaims,
			),
		).rejects.toThrow("Cloudflare Access identity is invalid");
	});

	it.each([
		{
			claims: {
				email: "owner@lemn.test",
				sub: "access-user",
				type: "org",
			},
			email: "owner@lemn.test",
			purpose: "admin" as const,
		},
		{
			claims: {
				common_name: "88bf3b6d86161464f6509f7219099e57.access",
				sub: "",
				type: "org",
			},
			email: undefined,
			purpose: "health" as const,
		},
	])("rejects a $purpose org-session token", async ({
		claims,
		email,
		purpose,
	}) => {
		const verifier = vi.fn<AccessVerifier>().mockResolvedValue(claims);
		await expect(
			accessIdentity(request(email, "signed-org-jwt"), ENV, purpose, verifier),
		).rejects.toThrow("application token is required");
	});

	it("fails closed for missing or malformed issuer and audience configuration", async () => {
		const verifier = vi.fn<AccessVerifier>();
		for (const env of [
			{},
			{ ...ENV, ACCESS_AUDIENCE: "" },
			{ ...ENV, ACCESS_ISSUER: "https://example.com" },
		] satisfies readonly UiPortalEnv[]) {
			await expect(
				accessIdentity(
					request("owner@lemn.test", "signed-access-jwt"),
					env,
					"admin",
					verifier,
				),
			).rejects.toThrow("Cloudflare Access verification is not configured");
		}
		expect(verifier).not.toHaveBeenCalled();
	});
});
