import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
	FONT_CDN_CORS_PROBE_ORIGIN,
	parseArguments,
	publicObjectExists,
	validateCatalog,
	validateCloudflareAuthEnvironment,
	verifyFaceBytes,
	verifyLicenseBytes,
	verifyPublicFontHeaders,
	verifyPublicLicenseHeaders,
	wranglerPutArguments,
} from "../../scripts/fonts/sync-font-cdn.ts";

async function loadCatalog() {
	return validateCatalog(
		JSON.parse(
			await readFile(
				new URL("../../scripts/fonts/catalog.json", import.meta.url),
				"utf8",
			),
		),
	);
}

function firstFamilyAndFace(catalog: Awaited<ReturnType<typeof loadCatalog>>) {
	const family = catalog.families.at(0);
	assert.ok(family);
	const face = family.faces.at(0);
	assert.ok(face);
	return { family, face };
}

test("font CDN catalog fixes eight curated families and immutable face URLs", async () => {
	const catalog = await loadCatalog();
	assert.equal(catalog.delivery.r2BucketName, "lemn-dev-ui-font-assets");
	assert.deepEqual(
		catalog.families.map((family) => family.family),
		[
			"Inter",
			"Open Sans",
			"Source Sans 3",
			"Plus Jakarta Sans",
			"Space Grotesk",
			"Source Serif 4",
			"Lora",
			"JetBrains Mono",
		],
	);
	const faces = catalog.families.flatMap((family) => family.faces);
	assert.equal(faces.length, 15);
	assert.equal(new Set(faces.map((face) => face.id)).size, faces.length);
	assert.equal(new Set(faces.map((face) => face.sourceUrl)).size, faces.length);
	assert.equal(new Set(faces.map((face) => face.publicUrl)).size, faces.length);

	for (const family of catalog.families) {
		assert.equal(family.license.spdx, "OFL-1.1");
		assert.match(family.source.commitSha, /^[a-f0-9]{40}$/);
		assert.ok(family.license.url.includes(family.source.commitSha));
		assert.equal(
			family.license.localPath,
			`scripts/fonts/licenses/${family.id}/OFL.txt`,
		);
		assert.match(family.license.copyright, /^Copyright /);
		assert.equal(
			family.license.objectKey,
			`v2/licenses/${family.id}/${family.license.expectedSha256}/OFL.txt`,
		);
		assert.equal(
			family.license.publicUrl,
			`https://fonts.ui.le-mn.com/v2/licenses/${family.id}/${family.license.expectedSha256}/OFL.txt`,
		);
		assert.ok(family.source.directoryUrl.includes(family.source.commitSha));
		assert.equal(
			new URL(family.source.upstreamProjectUrl).hostname,
			"github.com",
		);
		for (const face of family.faces) {
			assert.equal(new URL(face.sourceUrl).hostname, "fonts.gstatic.com");
			assert.equal(
				face.objectKey,
				`v2/${face.expectedSha256}/${face.fileName}`,
			);
			assert.equal(
				face.publicUrl,
				`https://fonts.ui.le-mn.com/v2/${face.expectedSha256}/${face.fileName}`,
			);
		}
	}
});

test("governed OFL artifacts are exact, attributable and independently hashed", async () => {
	const catalog = await loadCatalog();
	const licenseHashes = new Set<string>();
	for (const family of catalog.families) {
		const bytes = new Uint8Array(
			await readFile(
				new URL(`../../${family.license.localPath}`, import.meta.url),
			),
		);
		assert.doesNotThrow(() => verifyLicenseBytes(family.license, bytes));
		assert.equal(
			createHash("sha256").update(bytes).digest("hex"),
			family.license.expectedSha256,
		);
		assert.equal(bytes.byteLength, family.license.expectedBytes);
		licenseHashes.add(family.license.expectedSha256);
	}
	assert.equal(licenseHashes.size, catalog.families.length);
});

test("font CDN CORS policy is public read-only and cacheable", async () => {
	const policy = JSON.parse(
		await readFile(
			new URL("../../scripts/fonts/cors-policy.json", import.meta.url),
			"utf8",
		),
	);
	assert.deepEqual(policy, {
		rules: [
			{
				allowed: {
					origins: ["*"],
					methods: ["GET", "HEAD"],
					headers: [],
				},
				exposeHeaders: ["ETag"],
				maxAgeSeconds: 86400,
			},
		],
	});
});

test("public font verification sends Origin and enforces delivery headers", async () => {
	const catalog = await loadCatalog();
	const { family, face } = firstFamilyAndFace(catalog);
	const bytes = new TextEncoder().encode("wOF2deterministic-public-font");
	const verifiedFace = {
		...face,
		expectedBytes: bytes.byteLength,
		expectedSha256: createHash("sha256").update(bytes).digest("hex"),
	};
	let requestHeaders: Headers | undefined;
	const exists = await publicObjectExists(
		{ family, face: verifiedFace, localPath: `/tmp/${face.fileName}` },
		async (_input, init) => {
			requestHeaders = new Headers(init?.headers);
			return new Response(bytes, {
				status: 200,
				headers: {
					"Access-Control-Allow-Origin": "*",
					"Cache-Control": "immutable, PUBLIC, max-age=31536000",
					"Content-Type": "font/woff2",
				},
			});
		},
	);

	assert.equal(exists, true);
	assert.equal(requestHeaders?.get("origin"), FONT_CDN_CORS_PROBE_ORIGIN);
	assert.equal(requestHeaders?.get("accept"), "font/woff2");
});

test("public font verification rejects missing or unsafe response headers", () => {
	const validHeaders = {
		"Access-Control-Allow-Origin": "*",
		"Cache-Control": "public, max-age=31536000, immutable",
		"Content-Type": "font/woff2",
	};
	assert.doesNotThrow(() =>
		verifyPublicFontHeaders(new Response(null, { headers: validHeaders })),
	);

	for (const [header, value, message] of [
		["Content-Type", "application/octet-stream", /Content-Type/],
		["Cache-Control", "public, max-age=31536000", /immutable/],
		["Access-Control-Allow-Origin", "https://example.com", /CORS/],
	] as const) {
		assert.throws(
			() =>
				verifyPublicFontHeaders(
					new Response(null, { headers: { ...validHeaders, [header]: value } }),
				),
			message,
		);
	}
});

test("public OFL verification enforces plain text and immutable delivery", async () => {
	const catalog = await loadCatalog();
	const family = catalog.families.at(0);
	assert.ok(family);
	const bytes = new Uint8Array(
		await readFile(
			new URL(`../../${family.license.localPath}`, import.meta.url),
		),
	);
	let requestHeaders: Headers | undefined;
	const exists = await publicObjectExists(
		{
			family,
			license: family.license,
			localPath: `/tmp/${family.id}-OFL.txt`,
		},
		async (_input, init) => {
			requestHeaders = new Headers(init?.headers);
			return new Response(bytes, {
				status: 200,
				headers: {
					"Access-Control-Allow-Origin": "*",
					"Cache-Control": "public, max-age=31536000, immutable",
					"Content-Type": "text/plain; charset=utf-8",
				},
			});
		},
	);

	assert.equal(exists, true);
	assert.equal(requestHeaders?.get("accept"), "text/plain");
	assert.doesNotThrow(() =>
		verifyPublicLicenseHeaders(
			new Response(null, {
				headers: {
					"Access-Control-Allow-Origin": "*",
					"Cache-Control": "public, max-age=31536000, immutable",
					"Content-Type": "text/plain; charset=utf-8",
				},
			}),
		),
	);
	assert.throws(
		() =>
			verifyPublicLicenseHeaders(
				new Response(null, {
					headers: {
						"Access-Control-Allow-Origin": "*",
						"Cache-Control": "public, max-age=31536000, immutable",
						"Content-Type": "application/octet-stream",
					},
				}),
			),
		/Content-Type/,
	);
});

test("font CDN catalog rejects unapproved binary hosts and mutable paths", async () => {
	const catalog = await loadCatalog();
	const unapprovedHost = structuredClone(catalog);
	firstFamilyAndFace(unapprovedHost).face.sourceUrl =
		"https://example.com/inter.woff2";
	assert.throws(
		() => validateCatalog(unapprovedHost),
		/sourceUrl host is not approved/,
	);

	const mutablePath = structuredClone(catalog);
	firstFamilyAndFace(mutablePath).face.objectKey = "v2/inter.woff2";
	assert.throws(() => validateCatalog(mutablePath), /objectKey must be/);

	const missingGovernedLicense = structuredClone(catalog);
	const family = missingGovernedLicense.families.at(0);
	assert.ok(family);
	family.license.localPath = "../outside/OFL.txt";
	assert.throws(
		() => validateCatalog(missingGovernedLicense),
		/license\.localPath must be/,
	);

	const mutableLicenseSource = structuredClone(catalog);
	const mutableFamily = mutableLicenseSource.families.at(0);
	assert.ok(mutableFamily);
	mutableFamily.source.directoryUrl =
		"https://github.com/google/fonts/tree/main/ofl/inter";
	assert.throws(
		() => validateCatalog(mutableLicenseSource),
		/source directory is not commit-pinned/,
	);
});

test("font byte verification checks magic, size, and SHA-256", () => {
	const bytes = new TextEncoder().encode("wOF2deterministic-test-font");
	const face = {
		id: "test-face",
		style: "normal" as const,
		weightRange: { min: 400, max: 400 },
		subset: "latin" as const,
		unicodeRange: "U+0000-00FF",
		sourceUrl: "https://fonts.gstatic.com/test.woff2",
		expectedSha256: createHash("sha256").update(bytes).digest("hex"),
		expectedBytes: bytes.byteLength,
		fileName: "test-face.woff2",
		objectKey: "",
		publicUrl: "",
	};
	assert.doesNotThrow(() => verifyFaceBytes(face, bytes));
	assert.throws(
		() => verifyFaceBytes(face, new TextEncoder().encode("bad!")),
		/not a WOFF2 binary/,
	);
	assert.throws(
		() =>
			verifyFaceBytes({ ...face, expectedBytes: bytes.byteLength + 1 }, bytes),
		/size mismatch/,
	);
	assert.throws(
		() => verifyFaceBytes({ ...face, expectedSha256: "0".repeat(64) }, bytes),
		/SHA-256 mismatch/,
	);
});

test("font sync is preflight by default and builds a secret-free Wrangler put", async () => {
	assert.deepEqual(parseArguments([]), {
		mode: "preflight",
		manifestPath: new URL("../../scripts/fonts/catalog.json", import.meta.url)
			.pathname,
		bucket: undefined,
		jurisdiction: undefined,
		help: false,
	});
	assert.equal(
		parseArguments(["--apply", "--bucket", "prod-fonts-r2"]).mode,
		"apply",
	);
	assert.throws(
		() => parseArguments(["--apply", "--preflight"]),
		/Choose exactly one/,
	);

	const catalog = await loadCatalog();
	const { family, face } = firstFamilyAndFace(catalog);
	const args = wranglerPutArguments(catalog, "prod-fonts-r2", {
		family,
		face,
		localPath: `/tmp/${face.fileName}`,
	});
	assert.deepEqual(args.slice(0, 5), [
		"exec",
		"wrangler",
		"r2",
		"object",
		"put",
	]);
	assert.ok(args.includes("--remote"));
	assert.ok(args.includes("font/woff2"));
	assert.ok(args.includes("public, max-age=31536000, immutable"));
	assert.equal(
		args.some((argument) => /token|secret|credential/i.test(argument)),
		false,
	);

	const licenseArgs = wranglerPutArguments(catalog, "prod-fonts-r2", {
		family,
		license: family.license,
		localPath: `/tmp/${family.id}-OFL.txt`,
	});
	assert.ok(licenseArgs.includes("text/plain; charset=utf-8"));
	assert.ok(
		licenseArgs.some((argument) =>
			argument.endsWith(
				`/v2/licenses/${family.id}/${family.license.expectedSha256}/OFL.txt`,
			),
		),
	);
});

test("font sync accepts one Cloudflare auth mode and never echoes credentials", () => {
	assert.equal(
		validateCloudflareAuthEnvironment({
			CLOUDFLARE_API_TOKEN: "token-value-must-not-leak",
		}),
		"api-token",
	);
	assert.equal(
		validateCloudflareAuthEnvironment({
			CLOUDFLARE_API_KEY: "global-key-must-not-leak",
			CLOUDFLARE_EMAIL: "operator@example.com",
			CLOUDFLARE_ACCOUNT_ID: "0123456789abcdef0123456789abcdef",
		}),
		"global-api-key",
	);
	for (const environment of [
		{ CLOUDFLARE_API_KEY: "global-key-must-not-leak" },
		{ CLOUDFLARE_EMAIL: "operator@example.com" },
		{
			CLOUDFLARE_API_KEY: "global-key-must-not-leak",
			CLOUDFLARE_EMAIL: "operator@example.com",
		},
		{
			CLOUDFLARE_API_TOKEN: "token-value-must-not-leak",
			CLOUDFLARE_API_KEY: "global-key-must-not-leak",
			CLOUDFLARE_EMAIL: "operator@example.com",
			CLOUDFLARE_ACCOUNT_ID: "0123456789abcdef0123456789abcdef",
		},
	]) {
		assert.throws(
			() => validateCloudflareAuthEnvironment(environment),
			(error: unknown) => {
				assert.ok(error instanceof Error);
				assert.doesNotMatch(
					error.message,
					/must-not-leak|operator@example\.com/,
				);
				return true;
			},
		);
	}
});
