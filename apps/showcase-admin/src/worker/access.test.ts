import { describe, expect, it, vi } from "vitest";
import { type AccessVerifier, accessHeaders, accessIdentity } from "./access";
import type { ShowcaseAdminEnv } from "./env";

const ENV: ShowcaseAdminEnv = {
	ACCESS_AUDIENCE: "access-audience",
	ACCESS_HEALTH_AUDIENCE: "access-health-audience",
	ACCESS_ISSUER: "https://lemn-dev.cloudflareaccess.com",
	DEPLOYMENT_ENVIRONMENT: "production",
};

function request(
	email?: string,
	assertion?: string,
	path = "/",
	method = "GET",
): Request {
	const headers = new Headers();
	if (email) headers.set("cf-access-authenticated-user-email", email);
	if (assertion) headers.set("cf-access-jwt-assertion", assertion);
	return new Request(`https://admin.showcase.ui.le-mn.com${path}`, {
		headers,
		method,
	});
}

describe("Cloudflare Access origin validation", () => {
	it("does not trust a request without a signed Access assertion", async () => {
		const verifier = vi.fn<AccessVerifier>();
		await expect(
			accessIdentity(request(), ENV, verifier),
		).resolves.toBeUndefined();
		await expect(
			accessIdentity(request("owner@lemn.test"), ENV, verifier),
		).resolves.toBeUndefined();
		expect(verifier).not.toHaveBeenCalled();
	});

	it("returns only the identity proven by the signed assertion", async () => {
		const verifier = vi.fn<AccessVerifier>().mockResolvedValue({
			iss: ENV.ACCESS_ISSUER,
			aud: ENV.ACCESS_AUDIENCE,
			sub: "access-user",
			email: "owner@lemn.test",
			iat: 1,
			exp: 2,
		});
		await expect(
			accessIdentity(
				request("OWNER@LEMN.TEST", "signed-access-jwt"),
				ENV,
				verifier,
			),
		).resolves.toEqual({
			kind: "human",
			email: "owner@lemn.test",
			assertion: "signed-access-jwt",
		});
		expect(verifier).toHaveBeenCalledWith("signed-access-jwt", {
			issuer: ENV.ACCESS_ISSUER,
			audience: ENV.ACCESS_AUDIENCE,
		});
	});

	it("returns a distinct service identity from the signed Access service-token claims", async () => {
		const verifier = vi.fn<AccessVerifier>().mockResolvedValue({
			iss: ENV.ACCESS_ISSUER,
			aud: ENV.ACCESS_AUDIENCE,
			sub: "",
			common_name: "88BF3B6D86161464F6509F7219099E57.access",
			iat: 1,
			exp: 2,
		});
		await expect(
			accessIdentity(
				request(undefined, "signed-service-jwt", "/health"),
				ENV,
				verifier,
			),
		).resolves.toEqual({
			kind: "service",
			serviceTokenId: "88bf3b6d86161464f6509f7219099e57.access",
			assertion: "signed-service-jwt",
		});
		expect(verifier).toHaveBeenCalledWith("signed-service-jwt", {
			issuer: ENV.ACCESS_ISSUER,
			audience: ENV.ACCESS_HEALTH_AUDIENCE,
		});
	});

	it("uses the health audience only for production GET /health", async () => {
		const verifier = vi.fn<AccessVerifier>().mockResolvedValue({
			sub: "access-user",
			email: "owner@lemn.test",
		});
		await accessIdentity(
			request("owner@lemn.test", "health-jwt", "/health"),
			ENV,
			verifier,
		);
		await accessIdentity(
			request("owner@lemn.test", "business-jwt", "/api/registry"),
			ENV,
			verifier,
		);
		await accessIdentity(
			request("owner@lemn.test", "health-post-jwt", "/health", "POST"),
			ENV,
			verifier,
		);
		expect(verifier).toHaveBeenNthCalledWith(1, "health-jwt", {
			issuer: ENV.ACCESS_ISSUER,
			audience: ENV.ACCESS_HEALTH_AUDIENCE,
		});
		expect(verifier).toHaveBeenNthCalledWith(2, "business-jwt", {
			issuer: ENV.ACCESS_ISSUER,
			audience: ENV.ACCESS_AUDIENCE,
		});
		expect(verifier).toHaveBeenNthCalledWith(3, "health-post-jwt", {
			issuer: ENV.ACCESS_ISSUER,
			audience: ENV.ACCESS_AUDIENCE,
		});
	});

	it("rejects a spoofed email header that differs from the signed claim", async () => {
		const verifier = vi.fn<AccessVerifier>().mockResolvedValue({
			sub: "access-user",
			email: "other@lemn.test",
		});
		await expect(
			accessIdentity(
				request("owner@lemn.test", "signed-access-jwt"),
				ENV,
				verifier,
			),
		).rejects.toThrow("Cloudflare Access identity is invalid");
	});

	it("rejects malformed or human-spoofing service identities", async () => {
		const nonServiceSubject = vi.fn<AccessVerifier>().mockResolvedValue({
			sub: "access-user",
			common_name: "88bf3b6d86161464f6509f7219099e57.access",
		});
		await expect(
			accessIdentity(
				request(undefined, "signed-service-jwt", "/health"),
				ENV,
				nonServiceSubject,
			),
		).rejects.toThrow("Cloudflare Access identity is invalid");

		const spoofedEmail = vi.fn<AccessVerifier>().mockResolvedValue({
			sub: "",
			common_name: "88bf3b6d86161464f6509f7219099e57.access",
		});
		await expect(
			accessIdentity(
				request("owner@lemn.test", "signed-service-jwt", "/health"),
				ENV,
				spoofedEmail,
			),
		).rejects.toThrow("Cloudflare Access identity is invalid");
	});

	it("never grants a service identity access to Admin business capabilities", () => {
		expect(() =>
			accessHeaders({
				kind: "service",
				serviceTokenId: "88bf3b6d86161464f6509f7219099e57.access",
				assertion: "signed-service-jwt",
			}),
		).toThrow("cannot call business capabilities");
	});

	it("fails closed when issuer or audience is not configured", async () => {
		const verifier = vi.fn<AccessVerifier>();
		await expect(
			accessIdentity(
				request("owner@lemn.test", "signed-access-jwt"),
				{},
				verifier,
			),
		).rejects.toThrow("Cloudflare Access verification is not configured");
		expect(verifier).not.toHaveBeenCalled();
	});
});
