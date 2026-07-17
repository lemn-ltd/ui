import { describe, expect, it, vi } from "vitest";
import { uiShowcaseAppDescriptor } from "../../app-descriptor";
import type { UiShowcaseEnv } from "../env";
import UiShowcaseWorker from "../index";

const legacyUiPackage = `@${["app", "ranks"].join("")}/ui`;
const LEGACY_UI_PACKAGE_PATTERN = new RegExp(
	`${legacyUiPackage}(?![-A-Za-z0-9])`,
	"u",
);
const protectedStatusRoutes = ["/_status", "/_status.json", "/health/deep"];
const statusToken = "test-only-status-token";

function assetsFetcher(): Fetcher {
	return {
		fetch: vi.fn(
			async () => new Response('<div id="root"></div>', { status: 200 }),
		),
	} as unknown as Fetcher;
}

function createWorker(overrides: Partial<UiShowcaseEnv> = {}) {
	const env: UiShowcaseEnv = {
		ASSETS: assetsFetcher(),
		DEPLOYMENT_ENVIRONMENT: "test",
		...overrides,
	};
	return new UiShowcaseWorker({} as ExecutionContext, env);
}

function request(pathname: string, init?: RequestInit): Request {
	return new Request(`https://ui-showcase.example.test${pathname}`, init);
}

async function expectTokenIsNotExposed(
	response: Response,
	token: string,
): Promise<void> {
	const responseText = await response.clone().text();
	expect(responseText).not.toContain(token);
	expect(JSON.stringify(Object.fromEntries(response.headers))).not.toContain(
		token,
	);
}

describe("ui showcase worker", () => {
	it("answers /health with a 200 health shape", async () => {
		const worker = createWorker({
			BUILD_GIT_SHA: "abc123",
			BUILD_TIME: "2026-07-14T00:00:00Z",
			BUILD_VERSION: "1.2.3",
		});
		const response = await worker.fetch(request("/health"));
		expect(response.status).toBe(200);
		expect(await response.json()).toMatchObject({
			ok: true,
			service: uiShowcaseAppDescriptor.name,
			version: "1.2.3",
			gitSha: "abc123",
			buildTime: "2026-07-14T00:00:00Z",
		});
	});

	it("exposes the exact build identity from readiness", async () => {
		const worker = createWorker({
			BUILD_GIT_SHA: "release-sha",
			BUILD_TIME: "2026-07-14T00:00:00Z",
			BUILD_VERSION: "1.2.3",
		});
		const response = await worker.fetch(request("/health/ready"));
		expect(response.status).toBe(200);
		expect(await response.json()).toMatchObject({
			ok: true,
			version: "1.2.3",
			gitSha: "release-sha",
			buildTime: "2026-07-14T00:00:00Z",
		});
	});

	it("serves the SPA bundle for application routes through ASSETS", async () => {
		const assets = assetsFetcher();
		const worker = createWorker({ ASSETS: assets });
		const response = await worker.fetch(request("/core/components/button"));
		expect(response.status).toBe(200);
		expect(assets.fetch).toHaveBeenCalledTimes(1);
	});

	it("publishes the LEMN package identity in catalog and agent endpoints", async () => {
		const worker = createWorker({ BUILD_VERSION: "1.2.3" });

		const catalogResponse = await worker.fetch(request("/catalog.json"));
		expect(catalogResponse.status).toBe(200);
		const catalog = await catalogResponse.json<{
			components: readonly { area: "core" | "agents" }[];
			package: string;
			source: string;
			version: string;
		}>();
		expect(catalog).toMatchObject({
			package: "@lemn-ltd/ui",
			version: "1.2.3",
			source: "https://github.com/lemn-ltd/ui",
		});
		expect(catalog.components).toHaveLength(131);
		expect(
			catalog.components.filter((component) => component.area === "core"),
		).toHaveLength(102);
		expect(
			catalog.components.filter((component) => component.area === "agents"),
		).toHaveLength(29);
		expect(JSON.stringify(catalog)).not.toMatch(LEGACY_UI_PACKAGE_PATTERN);

		const summary = await (await worker.fetch(request("/llms.txt"))).text();
		expect(summary).toContain("# Lemn UI");
		expect(summary).toContain("https://showcase.ui.le-mn.com/catalog.json");
		expect(summary).toContain("@lemn-ltd/ui");
		expect(summary).not.toMatch(LEGACY_UI_PACKAGE_PATTERN);

		const full = await (await worker.fetch(request("/llms-full.txt"))).text();
		expect(full).toContain("from '@lemn-ltd/ui';");
		expect(full).toContain(
			"import { RadioGroup, RadioGroupItem } from '@lemn-ltd/ui';",
		);
		expect(full).toContain("import { GraphCanvas } from '@lemn-ltd/ui';");
		expect(full).not.toMatch(LEGACY_UI_PACKAGE_PATTERN);
		expect(full).not.toContain("@latest");
	});

	it("serves the immutable v1 brand schema only on the schema host", async () => {
		const worker = createWorker();
		const schema = await worker.fetch(
			new Request("https://schemas.ui.le-mn.com/branding/v1.json"),
		);
		expect(schema.status).toBe(200);
		expect(schema.headers.get("content-type")).toContain(
			"application/schema+json",
		);
		expect(schema.headers.get("cache-control")).toContain("immutable");
		expect(await schema.json()).toMatchObject({
			$id: "https://schemas.ui.le-mn.com/branding/v1.json",
		});

		const missing = await worker.fetch(
			new Request("https://schemas.ui.le-mn.com/unknown.json"),
		);
		expect(missing.status).toBe(404);
	});

	it("has no api branch — /api/* falls through to the SPA assets", async () => {
		const assets = assetsFetcher();
		const worker = createWorker({ ASSETS: assets });
		const response = await worker.fetch(request("/api/anything"));
		expect(response.status).toBe(200);
		expect(assets.fetch).toHaveBeenCalledTimes(1);
	});

	it("reports readiness 503 when the ASSETS binding is missing", async () => {
		const worker = createWorker({ ASSETS: undefined });
		const response = await worker.fetch(request("/core/components/button"));
		expect(response.status).toBe(503);
		expect(await response.json()).toMatchObject({
			error: "service_not_ready",
			missingBindings: ["ASSETS"],
		});
	});

	describe.each(protectedStatusRoutes)("protected status route %s", (route) => {
		function protectedWorker() {
			return createWorker({
				BUILD_GIT_SHA: "release-sha",
				BUILD_TIME: "2026-07-14T00:00:00Z",
				BUILD_VERSION: "1.2.3",
				DEPLOYMENT_ENVIRONMENT: "production",
				STATUS_TOKEN: statusToken,
			});
		}

		it("rejects a missing bearer token", async () => {
			const response = await protectedWorker().fetch(request(route));

			expect(response.status).toBe(401);
			expect(await response.clone().json()).toEqual({ error: "unauthorized" });
			await expectTokenIsNotExposed(response, statusToken);
		});

		it.each([
			"Bearer",
			"bearer test-only-status-token",
			"Basic test-only-status-token",
			"Bearer  test-only-status-token",
			"Bearer test-only-status-token trailing",
		])("rejects malformed authorization %s", async (authorization) => {
			const response = await protectedWorker().fetch(
				request(route, { headers: { authorization } }),
			);

			expect(response.status).toBe(401);
			await expectTokenIsNotExposed(response, statusToken);
		});

		it("rejects a wrong bearer token", async () => {
			const response = await protectedWorker().fetch(
				request(route, { headers: { authorization: "Bearer wrong-token" } }),
			);

			expect(response.status).toBe(401);
			await expectTokenIsNotExposed(response, statusToken);
		});

		it("does not accept the token from a query parameter", async () => {
			const response = await protectedWorker().fetch(
				request(`${route}?token=${encodeURIComponent(statusToken)}`),
			);

			expect(response.status).toBe(401);
			await expectTokenIsNotExposed(response, statusToken);
		});

		it("accepts the exact bearer token without exposing it", async () => {
			const response = await protectedWorker().fetch(
				request(route, {
					headers: { authorization: `Bearer ${statusToken}` },
				}),
			);

			expect(response.status).toBe(200);
			expect(await response.clone().json()).toMatchObject({
				ok: true,
				build: {
					version: "1.2.3",
					gitSha: "release-sha",
					time: "2026-07-14T00:00:00Z",
				},
			});
			await expectTokenIsNotExposed(response, statusToken);
		});
	});
});
