import { describe, expect, it, vi } from "vitest";
import type { AccessVerifier } from "./access";
import type { ShowcaseAdminEnv } from "./env";
import { handleShowcaseAdminRequest } from "./index";

const ENV: ShowcaseAdminEnv = {
	ACCESS_AUDIENCE: "access-audience",
	ACCESS_ISSUER: "https://lemn-dev.cloudflareaccess.com",
	DEPLOYMENT_ENVIRONMENT: "production",
	SIMULATOR: { fetch: vi.fn() } as unknown as Fetcher,
};

function serviceRequest(path: string): Request {
	return new Request(`https://admin.showcase.ui.le-mn.com${path}`, {
		headers: { "cf-access-jwt-assertion": "signed-service-jwt" },
	});
}

function serviceVerifier(): AccessVerifier {
	return vi.fn<AccessVerifier>().mockResolvedValue({
		iss: ENV.ACCESS_ISSUER,
		aud: ENV.ACCESS_AUDIENCE,
		sub: "",
		common_name: "88bf3b6d86161464f6509f7219099e57.access",
		iat: 1,
		exp: 2,
	});
}

describe("Showcase Admin deployment service token", () => {
	it("can prove the production health and simulator binding boundary", async () => {
		const response = await handleShowcaseAdminRequest(
			serviceRequest("/health"),
			ENV,
			serviceVerifier(),
		);
		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({
			ok: true,
			service: "ui-showcase-admin",
			environment: "production",
			simulatorConfigured: true,
		});
	});

	it("cannot use any Admin business capability", async () => {
		const response = await handleShowcaseAdminRequest(
			serviceRequest("/api/registry"),
			ENV,
			serviceVerifier(),
		);
		expect(response.status).toBe(403);
		expect(await response.json()).toMatchObject({
			code: "service-token-health-only",
		});
	});
});
