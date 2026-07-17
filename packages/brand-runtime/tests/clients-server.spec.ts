import { describe, expect, it, vi } from "vitest";
import {
	createHttpsBrandingRuntimeClient,
	createServiceBindingBrandingRuntimeClient,
} from "../src/index.js";
import { resolveBranding } from "../src/resolve.js";
import {
	assertBrandingHydrationIdentity,
	brandingContentSecurityPolicySources,
	createBrandingSsrParts,
} from "../src/server.js";
import {
	envelope,
	envelopeWithManagedFont,
	PREVIEW_DRAFT_TITLE,
	PREVIEW_SESSION_BEARER,
	PREVIEW_SESSION_ID,
	verifier,
	WORKSPACE_ID,
} from "./fixtures.js";

const RUNTIME_CREDENTIAL =
	"aob_runtime_testpref.ABCDEFGHIJKLMNOPQRSTUVWXYZabcdef0123456789_-";

describe("server transports and SSR helpers", () => {
	it("rejects non-Workspace credentials before an HTTPS request", () => {
		expect(() =>
			createHttpsBrandingRuntimeClient({
				baseUrl: "https://runtime.example.test",
				runtimeCredential: "not-a-runtime-credential",
			}),
		).toThrow("Workspace runtime credential is invalid");
	});

	it("keeps an HTTPS runtime credential in the Authorization header only", async () => {
		const active = await envelope("active");
		const captured: Array<{ url: string; init?: RequestInit }> = [];
		const fetch = vi.fn(
			async (input: RequestInfo | URL, init?: RequestInit) => {
				captured.push({ url: String(input), init });
				return new Response(JSON.stringify(active), {
					status: 200,
					headers: { "Content-Type": "application/json" },
				});
			},
		) as unknown as typeof globalThis.fetch;
		const credential = RUNTIME_CREDENTIAL;
		const client = createHttpsBrandingRuntimeClient({
			baseUrl: "https://runtime.example.test",
			runtimeCredential: credential,
			fetch,
		});

		await client.resolve(
			{ workspaceId: WORKSPACE_ID },
			{ signal: new AbortController().signal },
		);
		expect(captured[0]?.url).toBe(
			"https://runtime.example.test/internal/v1/branding/resolve",
		);
		expect(new Headers(captured[0]?.init?.headers).get("Authorization")).toBe(
			`Bearer ${credential}`,
		);
		expect(captured[0]?.url).not.toContain(credential);
		expect(String(captured[0]?.init?.body)).not.toContain(credential);
		expect(JSON.parse(String(captured[0]?.init?.body))).toEqual({});
	});

	it("uses only the short-lived session bearer for an exact preview", async () => {
		const preview = await envelope("preview");
		const captured: Array<{ url: string; init?: RequestInit }> = [];
		const fetch = vi.fn(
			async (input: RequestInfo | URL, init?: RequestInit) => {
				captured.push({ url: String(input), init });
				return new Response(JSON.stringify(preview), { status: 200 });
			},
		) as unknown as typeof globalThis.fetch;
		const client = createHttpsBrandingRuntimeClient({
			baseUrl: "https://runtime.example.test",
			runtimeCredential: RUNTIME_CREDENTIAL,
			fetch,
		});

		await client.resolve(
			{
				workspaceId: WORKSPACE_ID,
				modeId: "dark",
				preview: {
					workspaceId: WORKSPACE_ID,
					sessionId: PREVIEW_SESSION_ID,
					sessionBearer: PREVIEW_SESSION_BEARER,
					draftTitle: PREVIEW_DRAFT_TITLE,
					definitionHash: preview.definitionHash,
					expiresAt: preview.expiresAt,
				},
			},
			{ signal: new AbortController().signal },
		);

		expect(captured[0]?.url).toBe(
			"https://runtime.example.test/internal/v1/branding/previews/resolve",
		);
		expect(new Headers(captured[0]?.init?.headers).get("Authorization")).toBe(
			`Bearer ${PREVIEW_SESSION_BEARER}`,
		);
		expect(JSON.parse(String(captured[0]?.init?.body))).toEqual({
			sessionId: PREVIEW_SESSION_ID,
			requestedModeId: "dark",
		});
		expect(String(captured[0]?.init?.body)).not.toContain(
			preview.definitionHash,
		);
	});

	it("exchanges a one-use code into validated server-only preview claims", async () => {
		const expiresAt = "2035-01-01T00:00:00.000Z";
		const captured: Array<{ url: string; init?: RequestInit }> = [];
		const fetch = vi.fn(
			async (input: RequestInfo | URL, init?: RequestInit) => {
				captured.push({ url: String(input), init });
				return new Response(
					JSON.stringify({
						workspaceId: WORKSPACE_ID,
						sessionId: PREVIEW_SESSION_ID,
						sessionBearer: PREVIEW_SESSION_BEARER,
						draftTitle: PREVIEW_DRAFT_TITLE,
						definitionHash: "a".repeat(64),
						expiresAt,
					}),
					{ status: 200 },
				);
			},
		) as unknown as typeof globalThis.fetch;
		const client = createHttpsBrandingRuntimeClient({
			baseUrl: "https://runtime.example.test",
			runtimeCredential: RUNTIME_CREDENTIAL,
			fetch,
		});

		const selection = await client.exchangePreview(
			{
				expectedWorkspaceId: WORKSPACE_ID,
				sessionId: PREVIEW_SESSION_ID,
				code: "one-use-code-0123456789abcdef0123456789",
				origin: "https://lunaria.example.test",
				audience: "lunaria-care",
			},
			{ signal: new AbortController().signal },
		);

		expect(selection.sessionBearer).toBe(PREVIEW_SESSION_BEARER);
		expect(captured[0]?.url).toBe(
			"https://runtime.example.test/internal/v1/branding/previews/exchange",
		);
		expect(new Headers(captured[0]?.init?.headers).has("Authorization")).toBe(
			false,
		);
		expect(String(captured[0]?.init?.body)).not.toContain(RUNTIME_CREDENTIAL);
	});

	it("uses a private RPC Service Binding without an application secret", async () => {
		const active = await envelope("active");
		const preview = await envelope("preview");
		const resolveBranding = vi.fn(async () => active);
		const resolveBrandingPreview = vi.fn(async () => preview);
		const exchangeBrandingPreview = vi.fn(async () => ({
			workspaceId: WORKSPACE_ID,
			sessionId: PREVIEW_SESSION_ID,
			sessionBearer: PREVIEW_SESSION_BEARER,
			draftTitle: PREVIEW_DRAFT_TITLE,
			definitionHash: preview.definitionHash,
			expiresAt: preview.expiresAt,
		}));
		const client = createServiceBindingBrandingRuntimeClient({
			binding: {
				resolveBranding,
				resolveBrandingPreview,
				exchangeBrandingPreview,
			},
		});
		const controller = new AbortController();
		const addEventListener = vi.spyOn(controller.signal, "addEventListener");
		const removeEventListener = vi.spyOn(
			controller.signal,
			"removeEventListener",
		);
		await client.resolve(
			{ workspaceId: WORKSPACE_ID },
			{ signal: controller.signal },
		);
		expect(resolveBranding).toHaveBeenCalledWith({});

		await client.resolve(
			{
				workspaceId: WORKSPACE_ID,
				modeId: "dark",
				preview: {
					workspaceId: WORKSPACE_ID,
					sessionId: PREVIEW_SESSION_ID,
					sessionBearer: PREVIEW_SESSION_BEARER,
					draftTitle: PREVIEW_DRAFT_TITLE,
					definitionHash: preview.definitionHash,
					expiresAt: preview.expiresAt,
				},
			},
			{ signal: controller.signal },
		);
		expect(resolveBrandingPreview).toHaveBeenCalledWith({
			sessionId: PREVIEW_SESSION_ID,
			sessionBearer: PREVIEW_SESSION_BEARER,
			requestedModeId: "dark",
		});

		await client.exchangePreview(
			{
				expectedWorkspaceId: WORKSPACE_ID,
				sessionId: PREVIEW_SESSION_ID,
				code: "one-use-code-0123456789abcdef0123456789",
				origin: "https://lunaria.example.test",
				audience: "lunaria-care",
			},
			{ signal: controller.signal },
		);
		expect(exchangeBrandingPreview).toHaveBeenCalledWith({
			sessionId: PREVIEW_SESSION_ID,
			code: "one-use-code-0123456789abcdef0123456789",
			origin: "https://lunaria.example.test",
			audience: "lunaria-care",
		});
		expect(addEventListener).toHaveBeenCalledTimes(3);
		expect(removeEventListener).toHaveBeenCalledTimes(3);
		for (const [index, call] of addEventListener.mock.calls.entries()) {
			expect(removeEventListener.mock.calls[index]?.[0]).toBe("abort");
			expect(removeEventListener.mock.calls[index]?.[1]).toBe(call[1]);
		}
	});

	it("aborts every pending RPC call and observes late RPC failures", async () => {
		const preview = await envelope("preview");
		const activeRequest = rejectablePromise<unknown>();
		const previewRequest = rejectablePromise<unknown>();
		const exchangeRequest = rejectablePromise<unknown>();
		const client = createServiceBindingBrandingRuntimeClient({
			binding: {
				resolveBranding: () => activeRequest.promise,
				resolveBrandingPreview: () => previewRequest.promise,
				exchangeBrandingPreview: () => exchangeRequest.promise,
			},
		});
		const calls: ReadonlyArray<{
			readonly start: (signal: AbortSignal) => Promise<unknown>;
			readonly reject: (error: unknown) => void;
		}> = [
			{
				start: (signal) =>
					client.resolve({ workspaceId: WORKSPACE_ID }, { signal }),
				reject: activeRequest.reject,
			},
			{
				start: (signal) =>
					client.resolve(
						{
							workspaceId: WORKSPACE_ID,
							preview: {
								workspaceId: WORKSPACE_ID,
								sessionId: PREVIEW_SESSION_ID,
								sessionBearer: PREVIEW_SESSION_BEARER,
								draftTitle: PREVIEW_DRAFT_TITLE,
								definitionHash: preview.definitionHash,
								expiresAt: preview.expiresAt,
							},
						},
						{ signal },
					),
				reject: previewRequest.reject,
			},
			{
				start: (signal) =>
					client.exchangePreview(
						{
							expectedWorkspaceId: WORKSPACE_ID,
							sessionId: PREVIEW_SESSION_ID,
							code: "one-use-code-0123456789abcdef0123456789",
							origin: "https://lunaria.example.test",
							audience: "lunaria-care",
						},
						{ signal },
					),
				reject: exchangeRequest.reject,
			},
		];

		for (const [index, call] of calls.entries()) {
			const controller = new AbortController();
			const removeEventListener = vi.spyOn(
				controller.signal,
				"removeEventListener",
			);
			const result = call.start(controller.signal);
			controller.abort(new DOMException("caller stopped", "AbortError"));
			await expect(result).rejects.toMatchObject({
				code: "BRANDING_RUNTIME_UNAVAILABLE",
				cause: controller.signal.reason,
			});
			expect(removeEventListener).toHaveBeenCalledWith(
				"abort",
				expect.any(Function),
			);

			call.reject(new Error(`late RPC failure ${index}`));
			await Promise.resolve();
		}
	});

	it("places critical branding and the exact bootstrap before host markup", async () => {
		const active = await envelope("active");
		const fallback = await envelope("embedded-fallback");
		const resolved = await resolveBranding({
			workspaceId: WORKSPACE_ID,
			client: { resolve: async () => active },
			verifier,
			embeddedFallback: fallback,
		});
		const parts = createBrandingSsrParts(resolved, { nonce: "nonce-12345678" });

		expect(parts.htmlAttributes["data-lemn-branding-hash"]).toBe(
			resolved.compiledHash,
		);
		expect(parts.headMarkup).toContain(
			`<style data-lemn-critical-branding="${resolved.compiledHash}"`,
		);
		expect(parts.headMarkup).toContain(
			'<meta name="color-scheme" content="light">',
		);
		expect(parts.bootstrapMarkup).toContain(
			`data-lemn-branding-bootstrap="${resolved.compiledHash}"`,
		);
		expect(parts.bootstrapMarkup).not.toContain("</script><script");
		expect(() =>
			assertBrandingHydrationIdentity(
				resolved.compiledHash,
				resolved.bootstrap,
			),
		).not.toThrow();
		expect(() =>
			assertBrandingHydrationIdentity("0".repeat(64), resolved.bootstrap),
		).toThrow();
	});

	it("allows preferred managed font CSS through CSP without preloading it", async () => {
		const active = await envelopeWithManagedFont("preferred");
		const fallback = await envelope("embedded-fallback");
		const resolved = await resolveBranding({
			workspaceId: WORKSPACE_ID,
			client: { resolve: async () => active },
			verifier,
			embeddedFallback: fallback,
		});
		const parts = createBrandingSsrParts(resolved);

		expect(resolved.fontPreloads).toEqual([]);
		expect(resolved.fontResourceOrigins).toEqual([
			"https://fonts.ui.le-mn.com",
		]);
		expect(resolved.criticalCss).toContain("font-display: optional");
		expect(parts.headMarkup).not.toContain('rel="preload"');
		expect(brandingContentSecurityPolicySources(resolved).fontSrc).toEqual([
			"https://fonts.ui.le-mn.com",
		]);
	});

	it("preloads required managed fonts and emits deterministic credential-free SSR", async () => {
		const active = await envelopeWithManagedFont("required");
		const fallback = await envelope("embedded-fallback");
		const fetch = vi.fn(
			async () =>
				new Response(JSON.stringify(active), {
					status: 200,
					headers: { "Content-Type": "application/json" },
				}),
		) as unknown as typeof globalThis.fetch;
		const client = createHttpsBrandingRuntimeClient({
			baseUrl: "https://runtime.example.test",
			runtimeCredential: RUNTIME_CREDENTIAL,
			fetch,
		});
		const resolved = await resolveBranding({
			workspaceId: WORKSPACE_ID,
			client,
			verifier,
			embeddedFallback: fallback,
		});
		const first = {
			parts: createBrandingSsrParts(resolved, { nonce: "nonce-12345678" }),
			csp: brandingContentSecurityPolicySources(resolved),
		};
		const second = {
			parts: createBrandingSsrParts(resolved, { nonce: "nonce-12345678" }),
			csp: brandingContentSecurityPolicySources(resolved),
		};
		const serialized = JSON.stringify(first);

		expect(resolved.fontPreloads).toHaveLength(1);
		expect(resolved.criticalCss).toContain("font-display: block");
		expect(first.parts.headMarkup).toContain('rel="preload"');
		expect(first.csp.fontSrc).toEqual(["https://fonts.ui.le-mn.com"]);
		expect(first).toEqual(second);
		expect(serialized).not.toContain(RUNTIME_CREDENTIAL);
		expect(serialized).not.toContain("Authorization");
	});

	it("rejects unverified or credentialed font origins at the CSP boundary", async () => {
		const active = await envelopeWithManagedFont("required");
		const fallback = await envelope("embedded-fallback");
		const resolved = await resolveBranding({
			workspaceId: WORKSPACE_ID,
			client: { resolve: async () => active },
			verifier,
			embeddedFallback: fallback,
		});

		expect(() =>
			brandingContentSecurityPolicySources({
				...resolved,
				fontResourceOrigins: ["https://user:secret@fonts.ui.le-mn.com"],
			}),
		).toThrow("credential-free HTTPS");
		expect(() =>
			brandingContentSecurityPolicySources({
				...resolved,
				fontResourceOrigins: [],
			}),
		).toThrow("missing from the verified resource policy");
	});
});

function rejectablePromise<T>(): {
	readonly promise: Promise<T>;
	readonly reject: (error: unknown) => void;
} {
	let rejectPromise: (error: unknown) => void = () => undefined;
	const promise = new Promise<T>((_resolve, reject) => {
		rejectPromise = reject;
	});
	return { promise, reject: rejectPromise };
}
