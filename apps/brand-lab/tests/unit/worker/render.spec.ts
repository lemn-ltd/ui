import { describe, expect, it } from "vitest";
import { compileBrandProject } from "../../../src/branding/compiler";
import { createKvBrandSnapshotStore } from "../../../src/branding/kv-snapshot-store";
import {
	builtInBrandProjects,
	defaultBrandProject,
} from "../../../src/branding/presets";
import type { BrandLabInitialState } from "../../../src/lab/initial-state";
import type { BrandLabEnv } from "../../../src/worker/env";
import { handleBrandLabRequest } from "../../../src/worker/index";

const INDEX_TEMPLATE = `<!doctype html>
<html lang="en"><head><meta charset="UTF-8" /><!--brand-lab:head--></head>
<body><div id="root"><!--brand-lab:app--></div><!--brand-lab:state--><script type="module" src="/client.js"></script></body></html>`;
const PAIRED_DARK_PROJECT_ID = "codex-github-dark";

describe("Brand Lab SSR worker", () => {
	it("returns branded component markup, ECharts SVG and Recharts fallbacks before client scripts", async () => {
		const response = await renderRequest();
		const html = await response.text();
		const state = stateFromHtml(html);

		expect(response.status).toBe(200);
		expect(response.headers.get("content-type")).toContain("text/html");
		expect(response.headers.get("cache-control")).toContain("no-store");
		expect(response.headers.get("content-security-policy")).toContain("nonce-");
		expect(response.headers.get("set-cookie")).toContain("HttpOnly");
		expect(html.indexOf('id="brand-project-styles"')).toBeLessThan(
			html.indexOf('src="/client.js"'),
		);
		expect(html.indexOf('id="brand-lab-base-styles"')).toBeLessThan(
			html.indexOf('src="/client.js"'),
		);
		expect(html).toContain("brand-lab-button");
		expect(html).toContain("brand-lab-checkbox");
		expect(html).toContain('data-chart-provider="apache-echarts"');
		expect(html.match(/data-chart-provider="recharts"/g)).toHaveLength(2);
		expect(html.match(/data-recharts-ssr-fallback="true"/g)).toHaveLength(2);
		expect(html).toContain(
			`data-chart-primary="${state.activeProject.colors.chartPrimary}"`,
		);
		expect(html).not.toContain("&lt;svg");
		expect(html).toContain("<svg");
		expect(state.initialChartSvg).toContain("<svg");
	});

	it("uses one project identity across html, CSS and serialized hydration state", async () => {
		const response = await renderRequest(
			`https://brand-lab.test/?project=${PAIRED_DARK_PROJECT_ID}`,
		);
		const html = await response.text();
		const state = stateFromHtml(html);

		expect(state.activeProject.id).toBe(PAIRED_DARK_PROJECT_ID);
		expect(html).toContain(`data-brand-id="${state.snapshot.projectId}"`);
		expect(html).toContain(`data-brand-hash="${state.snapshot.hash}"`);
		expect(html).toContain(`data-brand-version="${state.snapshot.version}"`);
		expect(html).toContain(`:root[data-brand-hash="${state.snapshot.hash}"]`);
		expect(html).toContain(
			`data-brand-hash="${state.snapshot.hash}" data-chart-provider="apache-echarts"`,
		);
		expect(
			html.match(
				new RegExp(
					`data-chart-provider="recharts"[^>]+data-brand-hash="${state.snapshot.hash}"`,
					"g",
				),
			),
		).toHaveLength(2);
		expect(state.initialChartSvg).toContain(
			state.activeProject.colors.chartPrimary,
		);
	});

	it("uses a published KV project and serves it on the next SSR request", async () => {
		const kv = createMemoryKv();
		const secondProject = builtInBrandProjects.find(
			(project) => project.id === PAIRED_DARK_PROJECT_ID,
		);
		if (!secondProject) throw new Error("Missing paired dark project fixture");
		const project = {
			...secondProject,
			name: "Published Codex GitHub Dark",
			colors: {
				...secondProject.colors,
				accent: "#12a594",
				chartPrimary: "#12a594",
			},
		};
		await createKvBrandSnapshotStore(kv).publish(project);

		const response = await renderRequest(
			`https://brand-lab.test/?project=${PAIRED_DARK_PROJECT_ID}`,
			{ BRAND_PROJECTS: kv },
		);
		const html = await response.text();
		const state = stateFromHtml(html);

		expect(state.storageSource).toBe("kv");
		expect(state.storageDegraded).toBe(false);
		expect(state.activeProject.name).toBe("Published Codex GitHub Dark");
		expect(html).toContain("#12a594");
	});

	it("falls back to a complete brand on KV errors and invalid project ids", async () => {
		const throwingKv = {
			get: async () => {
				throw new Error("provider unavailable");
			},
		} as unknown as KVNamespace;
		const response = await renderRequest(
			"https://brand-lab.test/?project=unknown",
			{
				BRAND_PROJECTS: throwingKv,
			},
		);
		const html = await response.text();
		const state = stateFromHtml(html);

		expect(response.status).toBe(200);
		expect(state.activeProject.id).toBe(defaultBrandProject.id);
		expect(state.storageSource).toBe("fallback");
		expect(state.storageDegraded).toBe(true);
		expect(html).toContain(defaultBrandProject.colors.background);
		expect(html).not.toContain("provider unavailable");
	});

	it("returns a branded HTML failure surface when the asset binding fails", async () => {
		const response = await handleBrandLabRequest(
			new Request("https://brand-lab.test/"),
			{
				ASSETS: {
					fetch: async () => new Response("missing", { status: 404 }),
				} as unknown as Fetcher,
			},
		);
		const html = await response.text();
		const snapshot = compileBrandProject(defaultBrandProject);

		expect(response.status).toBe(503);
		expect(response.headers.get("content-type")).toContain("text/html");
		expect(html).toContain('class="brand-lab-fatal"');
		expect(html).toContain(`data-brand-hash="${snapshot.hash}"`);
		expect(html).toContain(snapshot.cssText);
	});

	it("publishes with same-origin CSRF protection and escapes state JSON", async () => {
		const kv = createMemoryKv();
		const env: Partial<BrandLabEnv> = { BRAND_PROJECTS: kv };
		const first = await renderRequest("https://brand-lab.test/", env);
		const firstHtml = await first.text();
		const firstState = stateFromHtml(firstHtml);
		const cookie = first.headers.get("set-cookie")?.split(";", 1)[0];
		const project = {
			...firstState.activeProject,
			name: "Safe </script> contract",
		};

		const publish = await handleBrandLabRequest(
			new Request(`https://brand-lab.test/api/projects/${project.id}`, {
				method: "PUT",
				headers: {
					origin: "https://brand-lab.test",
					cookie: cookie ?? "",
					"content-type": "application/json",
					"x-brand-lab-csrf": firstState.csrfToken,
				},
				body: JSON.stringify(project),
			}),
			env as BrandLabEnv,
		);
		expect(publish.status).toBe(200);

		const next = await renderRequest("https://brand-lab.test/", env);
		const html = await next.text();
		const stateBlock = stateBlockFromHtml(html);
		expect(stateBlock).toContain("Safe \\u003c/script> contract");
		expect(stateBlock).not.toContain("Safe </script> contract");
		expect(stateFromHtml(html).activeProject.name).toBe(
			"Safe </script> contract",
		);
	});

	it("rejects cross-origin writes before touching KV", async () => {
		const kv = createMemoryKv();
		const response = await handleBrandLabRequest(
			new Request(
				`https://brand-lab.test/api/projects/${defaultBrandProject.id}`,
				{
					method: "PUT",
					headers: { origin: "https://attacker.test" },
					body: JSON.stringify(defaultBrandProject),
				},
			),
			{ BRAND_PROJECTS: kv },
		);

		expect(response.status).toBe(403);
		expect(await response.json()).toEqual({ error: "Invalid request origin" });
	});

	it("accepts the trusted public host forwarded by the local Lemn tunnel", async () => {
		const kv = createMemoryKv();
		const first = await renderRequest();
		const firstState = stateFromHtml(await first.text());
		const cookie = first.headers.get("set-cookie")?.split(";", 1)[0];
		const response = await handleBrandLabRequest(
			new Request(
				`http://127.0.0.1:6501/api/projects/${defaultBrandProject.id}`,
				{
					method: "PUT",
					headers: {
						origin: "https://brand-lab-6501.le-mn.com",
						host: "127.0.0.1:6501",
						"x-forwarded-host": "brand-lab-6501.le-mn.com",
						"x-forwarded-proto": "https",
						cookie: cookie ?? "",
						"content-type": "application/json",
						"x-brand-lab-csrf": firstState.csrfToken,
					},
					body: JSON.stringify(defaultBrandProject),
				},
			),
			{ BRAND_PROJECTS: kv },
		);

		expect(response.status).toBe(200);
	});
});

async function renderRequest(
	url = "https://brand-lab.test/",
	partialEnv: Partial<BrandLabEnv> = {},
): Promise<Response> {
	const env: BrandLabEnv = {
		ASSETS: {
			fetch: async () => new Response(INDEX_TEMPLATE, { status: 200 }),
		} as unknown as Fetcher,
		...partialEnv,
	};
	return handleBrandLabRequest(new Request(url), env);
}

function stateFromHtml(html: string): BrandLabInitialState {
	return JSON.parse(stateBlockFromHtml(html)) as BrandLabInitialState;
}

function stateBlockFromHtml(html: string): string {
	const match = html.match(
		/<script id="brand-lab-state"[^>]*>([\s\S]*?)<\/script>/,
	);
	if (!match?.[1]) throw new Error("Missing Brand Lab state script");
	return match[1];
}

function createMemoryKv(): KVNamespace {
	const entries = new Map<string, string>();
	return {
		get: async (key: string) => entries.get(key) ?? null,
		put: async (
			key: string,
			value: string | ArrayBuffer | ArrayBufferView | ReadableStream,
		) => {
			if (typeof value !== "string")
				throw new Error("Test KV only accepts strings");
			entries.set(key, value);
		},
	} as unknown as KVNamespace;
}
