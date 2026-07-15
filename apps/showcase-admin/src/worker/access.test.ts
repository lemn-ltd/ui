import { describe, expect, it, vi } from "vitest";
import { accessIdentity, type AccessVerifier } from "./access";
import type { ShowcaseAdminEnv } from "./env";

const ENV: ShowcaseAdminEnv = {
	ACCESS_AUDIENCE: "access-audience",
	ACCESS_ISSUER: "https://lemn-dev.cloudflareaccess.com",
};

function request(email?: string, assertion?: string): Request {
	const headers = new Headers();
	if (email) headers.set("cf-access-authenticated-user-email", email);
	if (assertion) headers.set("cf-access-jwt-assertion", assertion);
	return new Request("https://admin.showcase.ui.le-mn.com", { headers });
}

describe("Cloudflare Access origin validation", () => {
	it("does not trust a request unless both Access headers are present", async () => {
		const verifier = vi.fn<AccessVerifier>();
		await expect(accessIdentity(request(), ENV, verifier)).resolves.toBeUndefined();
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
			accessIdentity(request("OWNER@LEMN.TEST", "signed-access-jwt"), ENV, verifier),
		).resolves.toEqual({ email: "owner@lemn.test", assertion: "signed-access-jwt" });
		expect(verifier).toHaveBeenCalledWith("signed-access-jwt", {
			issuer: ENV.ACCESS_ISSUER,
			audience: ENV.ACCESS_AUDIENCE,
		});
	});

	it("rejects a spoofed email header that differs from the signed claim", async () => {
		const verifier = vi.fn<AccessVerifier>().mockResolvedValue({ email: "other@lemn.test" });
		await expect(
			accessIdentity(request("owner@lemn.test", "signed-access-jwt"), ENV, verifier),
		).rejects.toThrow("Cloudflare Access identity is invalid");
	});

	it("fails closed when issuer or audience is not configured", async () => {
		const verifier = vi.fn<AccessVerifier>();
		await expect(
			accessIdentity(request("owner@lemn.test", "signed-access-jwt"), {}, verifier),
		).rejects.toThrow("Cloudflare Access verification is not configured");
		expect(verifier).not.toHaveBeenCalled();
	});
});
