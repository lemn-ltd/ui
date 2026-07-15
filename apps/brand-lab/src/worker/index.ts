import { createElement } from "react";
import { renderToString } from "react-dom/server";
import type { CompiledBrandSnapshot } from "../branding/compiler";
import type { BrandProject } from "../branding/contract";
import { parseBrandProject } from "../branding/contract";
import { createKvBrandSnapshotStore } from "../branding/kv-snapshot-store";
import { defaultBrandProject } from "../branding/presets";
import {
	type BrandSnapshotStore,
	resolveBuiltInBrandProjects,
} from "../branding/snapshot-store";
import baseStyles from "../lab/brand-lab.css?raw";
import { BrandLabApp } from "../lab/brand-lab-app";
import type {
	BrandLabInitialState,
	BrandProjectRecord,
} from "../lab/initial-state";
import { renderAreaChartSvg } from "../providers/echarts/area-chart-runtime";
import type { BrandLabEnv } from "./env";

const MAX_PROJECT_BODY_BYTES = 64 * 1024;
const CSRF_COOKIE = "brand_lab_csrf";

export default {
	fetch(request: Request, env: BrandLabEnv): Promise<Response> {
		return handleBrandLabRequest(request, env);
	},
} satisfies ExportedHandler<BrandLabEnv>;

export async function handleBrandLabRequest(
	request: Request,
	env: BrandLabEnv,
): Promise<Response> {
	const url = new URL(request.url);

	if (url.pathname === "/health") {
		return Response.json({
			ok: true,
			service: "ui-brand-lab",
			environment: env.DEPLOYMENT_ENVIRONMENT ?? "local",
		});
	}

	if (url.pathname.startsWith("/api/projects/")) {
		return handleProjectApi(request, env, url);
	}

	if (
		(url.pathname === "/" || url.pathname === "/index.html") &&
		request.method === "GET"
	) {
		return renderBrandLab(request, env, url);
	}

	if (env.ASSETS) {
		return env.ASSETS.fetch(request);
	}

	return new Response("Not found", { status: 404 });
}

async function renderBrandLab(
	request: Request,
	env: BrandLabEnv,
	url: URL,
): Promise<Response> {
	const store = brandStore(env);
	const resolvedProjects = await resolveBuiltInBrandProjects(store);
	const requestedProjectId = url.searchParams.get("project");
	const active =
		resolvedProjects.find(({ project }) => project.id === requestedProjectId) ??
		resolvedProjects.find(
			({ project }) => project.id === defaultBrandProject.id,
		) ??
		resolvedProjects[0];

	if (!active) {
		return new Response("Brand project catalog is empty", { status: 500 });
	}

	const nonce = createNonce();
	const csrfToken = createNonce();

	let initialChartSvg: string;
	try {
		initialChartSvg = renderAreaChartSvg(active.snapshot);
	} catch {
		return fatalBrandedResponse(
			active.snapshot,
			nonce,
			"The chart provider could not render the Brand Lab preview.",
			503,
		);
	}

	const initialState: BrandLabInitialState = {
		projects: resolvedProjects.map<BrandProjectRecord>((resolved) => ({
			project: resolved.project,
			source: resolved.source,
			degraded: resolved.degraded,
		})),
		activeProject: active.project,
		snapshot: active.snapshot,
		initialChartSvg,
		storageSource: active.source,
		storageDegraded: active.degraded,
		csrfToken,
	};

	let template: string;
	try {
		if (!env.ASSETS) throw new Error("Missing ASSETS binding");
		const assetUrl = new URL("/index.html", request.url);
		const assetResponse = await env.ASSETS.fetch(
			new Request(assetUrl.toString()),
		);
		if (!assetResponse.ok) throw new Error("Index asset is unavailable");
		template = await assetResponse.text();
	} catch {
		return fatalBrandedResponse(
			active.snapshot,
			nonce,
			"The Brand Lab shell is unavailable, but the project theme is still active.",
			503,
		);
	}

	const markup = renderToString(createElement(BrandLabApp, { initialState }));
	const html = injectServerDocument(template, {
		markup,
		nonce,
		snapshot: active.snapshot,
		state: initialState,
	});

	return new Response(html, {
		headers: documentHeaders(nonce, csrfToken, isSecureRequest(request, url)),
	});
}

async function handleProjectApi(
	request: Request,
	env: BrandLabEnv,
	url: URL,
): Promise<Response> {
	if (request.method !== "PUT") {
		return jsonError("Method not allowed", 405, { allow: "PUT" });
	}

	if (!isSameOriginRequest(request, url)) {
		return jsonError("Invalid request origin", 403);
	}

	const csrfHeader = request.headers.get("x-brand-lab-csrf");
	const csrfCookie = cookieValue(request.headers.get("cookie"), CSRF_COOKIE);
	if (!csrfHeader || !csrfCookie || csrfHeader !== csrfCookie) {
		return jsonError("Invalid CSRF token", 403);
	}

	const contentLength = Number(request.headers.get("content-length") ?? "0");
	if (
		Number.isFinite(contentLength) &&
		contentLength > MAX_PROJECT_BODY_BYTES
	) {
		return jsonError("Brand project payload is too large", 413);
	}

	let projectId: string;
	try {
		projectId = decodeURIComponent(url.pathname.slice("/api/projects/".length));
	} catch {
		return jsonError("Invalid project id", 400);
	}

	let input: unknown;
	try {
		const body = await request.text();
		if (new TextEncoder().encode(body).byteLength > MAX_PROJECT_BODY_BYTES) {
			return jsonError("Brand project payload is too large", 413);
		}
		input = JSON.parse(body);
	} catch {
		return jsonError("Request body must be valid JSON", 400);
	}

	let project: BrandProject;
	try {
		project = parseBrandProject(input);
	} catch {
		return jsonError("Brand project does not match schema v1", 400);
	}

	if (project.id !== projectId) {
		return jsonError("Project id does not match request path", 409);
	}

	const store = brandStore(env);
	if (!store) {
		return jsonError("Brand project storage is unavailable", 503);
	}

	try {
		const published = await store.publish(project);
		return Response.json(
			{
				project: published.project,
				snapshot: published.snapshot,
				source: "kv",
			},
			{ headers: { "cache-control": "no-store" } },
		);
	} catch {
		return jsonError("Brand project could not be published", 503);
	}
}

function brandStore(env: BrandLabEnv): BrandSnapshotStore | null {
	return env.BRAND_PROJECTS
		? createKvBrandSnapshotStore(env.BRAND_PROJECTS)
		: null;
}

function injectServerDocument(
	template: string,
	input: {
		readonly markup: string;
		readonly nonce: string;
		readonly snapshot: CompiledBrandSnapshot;
		readonly state: BrandLabInitialState;
	},
): string {
	const { markup, nonce, snapshot, state } = input;
	const criticalStyles = [
		`<style id="brand-project-styles" nonce="${nonce}" data-brand-hash="${snapshot.hash}" data-brand-version="${snapshot.version}">${snapshot.cssText}</style>`,
		`<style id="brand-lab-base-styles" nonce="${nonce}">${baseStyles}</style>`,
	].join("\n");
	const stateScript = `<script id="brand-lab-state" type="application/json" nonce="${nonce}">${serializeJsonForHtml(state)}</script>`;
	const htmlTag = `<html lang="en" data-brand-id="${escapeAttribute(snapshot.projectId)}" data-brand-hash="${snapshot.hash}" data-brand-version="${snapshot.version}" data-brand-appearance="${snapshot.appearance}" data-hydration="pending">`;

	const document = template
		.replace(/<html\s+lang="en"[^>]*>/, htmlTag)
		.replace("<!--brand-lab:head-->", criticalStyles)
		.replace("<!--brand-lab:app-->", markup)
		.replace("<!--brand-lab:state-->", stateScript);

	// Vite injects a development-only inline React Refresh bootstrap before the
	// template hooks. Noncing every remaining script keeps local validation under
	// the same CSP as the production build without permitting arbitrary scripts.
	return document.replace(
		/<script(?![^>]*\bnonce=)/g,
		`<script nonce="${nonce}"`,
	);
}

function fatalBrandedResponse(
	snapshot: CompiledBrandSnapshot,
	nonce: string,
	message: string,
	status: number,
): Response {
	const html = `<!doctype html>
<html lang="en" data-brand-id="${escapeAttribute(snapshot.projectId)}" data-brand-hash="${snapshot.hash}" data-brand-version="${snapshot.version}" data-brand-appearance="${snapshot.appearance}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Brand Lab unavailable</title>
  <style id="brand-project-styles" nonce="${nonce}">${snapshot.cssText}</style>
  <style id="brand-lab-base-styles" nonce="${nonce}">${baseStyles}</style>
</head>
<body><main class="brand-lab-fatal"><div><p class="brand-lab-eyebrow">LEMN UI · branded fallback</p><h1>Brand Lab is temporarily unavailable</h1><p>${escapeHtml(message)}</p></div></main></body>
</html>`;

	return new Response(html, {
		status,
		headers: documentHeaders(nonce),
	});
}

function documentHeaders(
	nonce: string,
	csrfToken?: string,
	secureCookie = false,
): Headers {
	const headers = new Headers({
		"cache-control": "no-store, max-age=0",
		"content-security-policy": [
			"default-src 'self'",
			`script-src 'self' 'nonce-${nonce}'`,
			"script-src-attr 'none'",
			`style-src 'self' 'nonce-${nonce}'`,
			"style-src-elem 'self' 'unsafe-inline'",
			"style-src-attr 'unsafe-inline'",
			"img-src 'self' data:",
			"connect-src 'self' ws: wss:",
			"font-src 'self' data:",
			"object-src 'none'",
			"base-uri 'none'",
			"frame-ancestors 'none'",
			"form-action 'self'",
		].join("; "),
		"content-type": "text/html; charset=utf-8",
		"referrer-policy": "no-referrer",
		"x-content-type-options": "nosniff",
	});

	if (csrfToken) {
		headers.set(
			"set-cookie",
			`${CSRF_COOKIE}=${csrfToken}; Path=/; Max-Age=3600; SameSite=Strict; HttpOnly${secureCookie ? "; Secure" : ""}`,
		);
	}
	return headers;
}

function jsonError(
	error: string,
	status: number,
	extraHeaders?: Readonly<Record<string, string>>,
): Response {
	return Response.json(
		{ error },
		{
			status,
			headers: {
				"cache-control": "no-store",
				...extraHeaders,
			},
		},
	);
}

function cookieValue(cookieHeader: string | null, name: string): string | null {
	if (!cookieHeader) return null;
	for (const part of cookieHeader.split(";")) {
		const [key, ...rest] = part.trim().split("=");
		if (key === name) return rest.join("=");
	}
	return null;
}

function isSameOriginRequest(request: Request, requestUrl: URL): boolean {
	const originHeader = request.headers.get("origin");
	if (!originHeader) return false;

	let origin: URL;
	try {
		origin = new URL(originHeader);
	} catch {
		return false;
	}

	const allowedHosts = new Set([requestUrl.host, request.headers.get("host")]);
	if (isLoopbackHost(requestUrl.hostname)) {
		allowedHosts.add(
			firstForwardedValue(request.headers.get("x-forwarded-host")),
		);
	}

	return (
		(origin.protocol === "http:" || origin.protocol === "https:") &&
		allowedHosts.has(origin.host)
	);
}

function isSecureRequest(request: Request, requestUrl: URL): boolean {
	if (requestUrl.protocol === "https:") return true;
	if (!isLoopbackHost(requestUrl.hostname)) return false;
	return (
		firstForwardedValue(request.headers.get("x-forwarded-proto")) === "https"
	);
}

function isLoopbackHost(hostname: string): boolean {
	return (
		hostname === "127.0.0.1" || hostname === "localhost" || hostname === "::1"
	);
}

function firstForwardedValue(value: string | null): string {
	return value?.split(",", 1)[0]?.trim() ?? "";
}

function serializeJsonForHtml(value: unknown): string {
	return JSON.stringify(value)
		.replace(/</g, "\\u003c")
		.replace(/\u2028/g, "\\u2028")
		.replace(/\u2029/g, "\\u2029");
}

function escapeAttribute(value: string): string {
	return escapeHtml(value).replace(/`/g, "&#96;");
}

function escapeHtml(value: string): string {
	return value
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#39;");
}

function createNonce(): string {
	return crypto.randomUUID().replace(/-/g, "");
}
