#!/usr/bin/env node
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const APPROVED_BINARY_HOSTS = new Set(["fonts.gstatic.com"]);
const SHA256_PATTERN = /^[a-f0-9]{64}$/;
const COMMIT_PATTERN = /^[a-f0-9]{40}$/;
const SAFE_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SAFE_FILE_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*\.woff2$/;
const SAFE_LICENSE_FILE_PATTERN = /^OFL\.txt$/;
const SAFE_BUCKET_PATTERN = /^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/;
export const FONT_CDN_CORS_PROBE_ORIGIN = "https://ui.le-mn.com";
const ALLOWED_ROLES = new Set([
	"body",
	"heading",
	"label",
	"display",
	"code",
	"data",
]);

export const DEFAULT_MANIFEST_PATH = resolve(
	import.meta.dirname,
	"catalog.json",
);

export interface FontFaceRecord {
	id: string;
	style: "normal" | "italic";
	weightRange: { min: number; max: number };
	subset: "latin";
	unicodeRange: string;
	sourceUrl: string;
	expectedSha256: string;
	expectedBytes: number;
	fileName: string;
	objectKey: string;
	publicUrl: string;
}

export interface FontLicenseRecord {
	spdx: "OFL-1.1";
	url: string;
	localPath: string;
	copyright: string;
	expectedSha256: string;
	expectedBytes: number;
	fileName: "OFL.txt";
	objectKey: string;
	publicUrl: string;
}

export interface FontFamilyRecord {
	id: string;
	family: string;
	category: "sans-serif" | "serif" | "monospace";
	roles: string[];
	fallbackRef: string;
	license: FontLicenseRecord;
	source: {
		providerRole: "official-distributor";
		repository: string;
		revisionType: "commit";
		commitSha: string;
		directoryUrl: string;
		upstreamProjectUrl: string;
		cssUrl: string;
	};
	faces: FontFaceRecord[];
}

export interface FontCdnCatalog {
	schemaVersion: 2;
	catalogId: string;
	owner: string;
	delivery: {
		publicBaseUrl: string;
		objectPrefix: string;
		r2BucketName: string;
		contentType: "font/woff2";
		licenseContentType: "text/plain; charset=utf-8";
		cacheControl: string;
		storageClass: "Standard";
	};
	sourcePolicy: {
		provider: "Google Fonts";
		repository: string;
		binaryHostAllowlist: string[];
		subset: "latin";
		transformation: "none";
		licenseSpdxAllowlist: string[];
	};
	families: FontFamilyRecord[];
}

export interface CliOptions {
	mode: "preflight" | "apply";
	manifestPath: string;
	bucket?: string;
	jurisdiction?: string;
	help: boolean;
}

export interface CommandResult {
	exitCode: number;
	output: string;
}

export type CommandRunner = (
	command: string,
	args: string[],
) => Promise<CommandResult>;

export interface VerifiedAsset {
	family: FontFamilyRecord;
	face: FontFaceRecord;
	localPath: string;
}

export interface VerifiedLicenseAsset {
	family: FontFamilyRecord;
	license: FontLicenseRecord;
	localPath: string;
}

export type VerifiedRemoteAsset = VerifiedAsset | VerifiedLicenseAsset;

function isRecord(value: unknown): value is Record<string, unknown> {
	return value !== null && typeof value === "object" && !Array.isArray(value);
}

function requireRecord(value: unknown, description: string) {
	if (!isRecord(value)) throw new Error(`${description} must be an object`);
	return value;
}

function requireString(value: unknown, description: string): string {
	if (typeof value !== "string" || value.trim().length === 0) {
		throw new Error(`${description} must be a non-empty string`);
	}
	return value;
}

function requireArray(value: unknown, description: string): unknown[] {
	if (!Array.isArray(value) || value.length === 0) {
		throw new Error(`${description} must be a non-empty array`);
	}
	return value;
}

function requireHttpsUrl(value: unknown, description: string): URL {
	const url = new URL(requireString(value, description));
	if (url.protocol !== "https:")
		throw new Error(`${description} must use HTTPS`);
	return url;
}

function requireUnique(
	value: string,
	values: Set<string>,
	description: string,
) {
	if (values.has(value)) throw new Error(`Duplicate ${description}: ${value}`);
	values.add(value);
}

export function validateCatalog(value: unknown): FontCdnCatalog {
	const catalog = requireRecord(value, "font catalog");
	if (catalog.schemaVersion !== 2) {
		throw new Error("font catalog schemaVersion must be 2");
	}
	if (catalog.catalogId !== "lemn-font-cdn-v2") {
		throw new Error("font catalog id must be lemn-font-cdn-v2");
	}
	requireString(catalog.owner, "font catalog owner");

	const delivery = requireRecord(catalog.delivery, "delivery");
	const publicBaseUrl = requireHttpsUrl(
		delivery.publicBaseUrl,
		"delivery.publicBaseUrl",
	)
		.toString()
		.replace(/\/$/, "");
	if (publicBaseUrl !== "https://fonts.ui.le-mn.com/v2") {
		throw new Error("delivery.publicBaseUrl must be the v2 LEMN font CDN");
	}
	if (delivery.objectPrefix !== "v2") {
		throw new Error("delivery.objectPrefix must be v2");
	}
	if (delivery.r2BucketName !== "lemn-dev-ui-font-assets") {
		throw new Error(
			"delivery.r2BucketName must identify the dedicated LEMN font bucket",
		);
	}
	if (delivery.contentType !== "font/woff2") {
		throw new Error("delivery.contentType must be font/woff2");
	}
	if (delivery.licenseContentType !== "text/plain; charset=utf-8") {
		throw new Error(
			"delivery.licenseContentType must be text/plain; charset=utf-8",
		);
	}
	if (delivery.cacheControl !== "public, max-age=31536000, immutable") {
		throw new Error("delivery.cacheControl must be immutable for one year");
	}
	if (delivery.storageClass !== "Standard") {
		throw new Error("delivery.storageClass must be Standard");
	}

	const sourcePolicy = requireRecord(catalog.sourcePolicy, "sourcePolicy");
	if (
		sourcePolicy.provider !== "Google Fonts" ||
		sourcePolicy.repository !== "https://github.com/google/fonts" ||
		sourcePolicy.subset !== "latin" ||
		sourcePolicy.transformation !== "none"
	) {
		throw new Error("sourcePolicy does not match the curated upstream policy");
	}
	const binaryHosts = requireArray(
		sourcePolicy.binaryHostAllowlist,
		"sourcePolicy.binaryHostAllowlist",
	).map((host, index) =>
		requireString(host, `sourcePolicy.binaryHostAllowlist[${index}]`),
	);
	if (
		binaryHosts.length !== 1 ||
		binaryHosts[0] !== "fonts.gstatic.com" ||
		!binaryHosts.every((host) => APPROVED_BINARY_HOSTS.has(host))
	) {
		throw new Error("Only fonts.gstatic.com is approved for WOFF2 downloads");
	}
	const licenseAllowlist = requireArray(
		sourcePolicy.licenseSpdxAllowlist,
		"sourcePolicy.licenseSpdxAllowlist",
	);
	if (licenseAllowlist.length !== 1 || licenseAllowlist[0] !== "OFL-1.1") {
		throw new Error("Only OFL-1.1 is approved in the initial catalog");
	}

	const familyIds = new Set<string>();
	const faceIds = new Set<string>();
	const sourceUrls = new Set<string>();
	const licenseSourceUrls = new Set<string>();
	const objectKeys = new Set<string>();
	const publicUrls = new Set<string>();
	const families = requireArray(catalog.families, "families");
	for (const [familyIndex, rawFamily] of families.entries()) {
		const family = requireRecord(rawFamily, `families[${familyIndex}]`);
		const familyId = requireString(family.id, `families[${familyIndex}].id`);
		if (!SAFE_ID_PATTERN.test(familyId)) {
			throw new Error(`Invalid family id: ${familyId}`);
		}
		requireUnique(familyId, familyIds, "family id");
		requireString(family.family, `${familyId}.family`);
		if (
			!new Set(["sans-serif", "serif", "monospace"]).has(
				String(family.category),
			)
		) {
			throw new Error(`${familyId}.category is invalid`);
		}
		for (const role of requireArray(family.roles, `${familyId}.roles`)) {
			if (typeof role !== "string" || !ALLOWED_ROLES.has(role)) {
				throw new Error(`${familyId} has unsupported role ${String(role)}`);
			}
		}
		requireString(family.fallbackRef, `${familyId}.fallbackRef`);

		const license = requireRecord(family.license, `${familyId}.license`);
		if (license.spdx !== "OFL-1.1") {
			throw new Error(`${familyId} must use the OFL-1.1 SPDX id`);
		}
		const licenseUrl = requireHttpsUrl(license.url, `${familyId}.license.url`);
		if (licenseUrl.hostname !== "raw.githubusercontent.com") {
			throw new Error(`${familyId} license must be pinned on GitHub`);
		}
		requireUnique(
			licenseUrl.toString(),
			licenseSourceUrls,
			"license source URL",
		);
		const expectedLocalPath = `scripts/fonts/licenses/${familyId}/OFL.txt`;
		if (license.localPath !== expectedLocalPath) {
			throw new Error(
				`${familyId}.license.localPath must be ${expectedLocalPath}`,
			);
		}
		const copyright = requireString(
			license.copyright,
			`${familyId}.license.copyright`,
		);
		if (!copyright.startsWith("Copyright ")) {
			throw new Error(`${familyId}.license.copyright must be an exact notice`);
		}
		const licenseSha256 = requireString(
			license.expectedSha256,
			`${familyId}.license.expectedSha256`,
		);
		if (!SHA256_PATTERN.test(licenseSha256)) {
			throw new Error(
				`${familyId}.license.expectedSha256 must be lowercase SHA-256`,
			);
		}
		if (
			!Number.isInteger(license.expectedBytes) ||
			Number(license.expectedBytes) < 1_000
		) {
			throw new Error(`${familyId}.license.expectedBytes is invalid`);
		}
		if (
			typeof license.fileName !== "string" ||
			!SAFE_LICENSE_FILE_PATTERN.test(license.fileName)
		) {
			throw new Error(`${familyId}.license.fileName must be OFL.txt`);
		}
		const expectedLicenseObjectKey = `v2/licenses/${familyId}/${licenseSha256}/OFL.txt`;
		if (license.objectKey !== expectedLicenseObjectKey) {
			throw new Error(
				`${familyId}.license.objectKey must be ${expectedLicenseObjectKey}`,
			);
		}
		requireUnique(expectedLicenseObjectKey, objectKeys, "object key");
		const expectedLicensePublicUrl = `${publicBaseUrl}/licenses/${familyId}/${licenseSha256}/OFL.txt`;
		if (license.publicUrl !== expectedLicensePublicUrl) {
			throw new Error(
				`${familyId}.license.publicUrl must be ${expectedLicensePublicUrl}`,
			);
		}
		requireUnique(expectedLicensePublicUrl, publicUrls, "public URL");

		const source = requireRecord(family.source, `${familyId}.source`);
		if (
			source.providerRole !== "official-distributor" ||
			source.repository !== "https://github.com/google/fonts" ||
			source.revisionType !== "commit"
		) {
			throw new Error(`${familyId} source provenance is invalid`);
		}
		const commitSha = requireString(source.commitSha, `${familyId}.commitSha`);
		if (!COMMIT_PATTERN.test(commitSha)) {
			throw new Error(`${familyId} commitSha must be a full SHA`);
		}
		if (!licenseUrl.pathname.includes(`/${commitSha}/`)) {
			throw new Error(`${familyId} license URL is not pinned to commitSha`);
		}
		const directoryUrl = requireHttpsUrl(
			source.directoryUrl,
			`${familyId}.source.directoryUrl`,
		);
		if (
			directoryUrl.hostname !== "github.com" ||
			!directoryUrl.pathname.includes(`/google/fonts/tree/${commitSha}/ofl/`)
		) {
			throw new Error(`${familyId} source directory is not commit-pinned`);
		}
		const upstreamProjectUrl = requireHttpsUrl(
			source.upstreamProjectUrl,
			`${familyId}.source.upstreamProjectUrl`,
		);
		if (upstreamProjectUrl.hostname !== "github.com") {
			throw new Error(`${familyId} upstream project must use GitHub`);
		}
		const cssUrl = requireHttpsUrl(source.cssUrl, `${familyId}.cssUrl`);
		if (cssUrl.hostname !== "fonts.googleapis.com") {
			throw new Error(`${familyId} CSS provenance must use Google Fonts`);
		}

		for (const [faceIndex, rawFace] of requireArray(
			family.faces,
			`${familyId}.faces`,
		).entries()) {
			const face = requireRecord(rawFace, `${familyId}.faces[${faceIndex}]`);
			const faceId = requireString(face.id, `${familyId}.face.id`);
			if (!SAFE_ID_PATTERN.test(faceId))
				throw new Error(`Invalid face id: ${faceId}`);
			requireUnique(faceId, faceIds, "face id");
			if (face.style !== "normal" && face.style !== "italic") {
				throw new Error(`${faceId}.style must be normal or italic`);
			}
			if (face.subset !== "latin") {
				throw new Error(`${faceId}.subset must be latin`);
			}
			requireString(face.unicodeRange, `${faceId}.unicodeRange`);
			const weightRange = requireRecord(
				face.weightRange,
				`${faceId}.weightRange`,
			);
			if (
				!Number.isInteger(weightRange.min) ||
				!Number.isInteger(weightRange.max) ||
				Number(weightRange.min) < 1 ||
				Number(weightRange.max) > 1000 ||
				Number(weightRange.min) > Number(weightRange.max)
			) {
				throw new Error(`${faceId}.weightRange is invalid`);
			}
			const sourceUrl = requireHttpsUrl(face.sourceUrl, `${faceId}.sourceUrl`);
			if (!binaryHosts.includes(sourceUrl.hostname)) {
				throw new Error(`${faceId}.sourceUrl host is not approved`);
			}
			if (!sourceUrl.pathname.endsWith(".woff2")) {
				throw new Error(`${faceId}.sourceUrl must end in .woff2`);
			}
			requireUnique(sourceUrl.toString(), sourceUrls, "source URL");

			const sha256 = requireString(
				face.expectedSha256,
				`${faceId}.expectedSha256`,
			);
			if (!SHA256_PATTERN.test(sha256)) {
				throw new Error(`${faceId}.expectedSha256 must be lowercase SHA-256`);
			}
			if (
				!Number.isInteger(face.expectedBytes) ||
				Number(face.expectedBytes) < 4
			) {
				throw new Error(`${faceId}.expectedBytes is invalid`);
			}
			const fileName = requireString(face.fileName, `${faceId}.fileName`);
			if (!SAFE_FILE_PATTERN.test(fileName) || fileName !== `${faceId}.woff2`) {
				throw new Error(`${faceId}.fileName must be derived from the face id`);
			}
			const expectedObjectKey = `v2/${sha256}/${fileName}`;
			if (face.objectKey !== expectedObjectKey) {
				throw new Error(`${faceId}.objectKey must be ${expectedObjectKey}`);
			}
			requireUnique(expectedObjectKey, objectKeys, "object key");
			const expectedPublicUrl = `${publicBaseUrl}/${sha256}/${fileName}`;
			if (face.publicUrl !== expectedPublicUrl) {
				throw new Error(`${faceId}.publicUrl must be ${expectedPublicUrl}`);
			}
			requireUnique(expectedPublicUrl, publicUrls, "public URL");
		}
	}

	return catalog as unknown as FontCdnCatalog;
}

export function verifyFaceBytes(face: FontFaceRecord, bytes: Uint8Array): void {
	if (new TextDecoder("ascii").decode(bytes.subarray(0, 4)) !== "wOF2") {
		throw new Error(`${face.id} is not a WOFF2 binary`);
	}
	if (bytes.byteLength !== face.expectedBytes) {
		throw new Error(
			`${face.id} size mismatch: expected ${face.expectedBytes}, received ${bytes.byteLength}`,
		);
	}
	const actualSha256 = createHash("sha256").update(bytes).digest("hex");
	if (actualSha256 !== face.expectedSha256) {
		throw new Error(
			`${face.id} SHA-256 mismatch: expected ${face.expectedSha256}, received ${actualSha256}`,
		);
	}
}

export function verifyLicenseBytes(
	license: FontLicenseRecord,
	bytes: Uint8Array,
): void {
	if (bytes.byteLength !== license.expectedBytes) {
		throw new Error(
			`OFL size mismatch: expected ${license.expectedBytes}, received ${bytes.byteLength}`,
		);
	}
	const actualSha256 = createHash("sha256").update(bytes).digest("hex");
	if (actualSha256 !== license.expectedSha256) {
		throw new Error(
			`OFL SHA-256 mismatch: expected ${license.expectedSha256}, received ${actualSha256}`,
		);
	}
	const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
	const firstLine = text.split(/\r?\n/, 1)[0];
	if (firstLine !== license.copyright) {
		throw new Error("OFL copyright notice does not match the catalog");
	}
	if (!text.includes("SIL OPEN FONT LICENSE Version 1.1")) {
		throw new Error("OFL artifact does not contain the SIL OFL 1.1 text");
	}
}

function isFontAsset(asset: VerifiedRemoteAsset): asset is VerifiedAsset {
	return "face" in asset;
}

function assetObjectKey(asset: VerifiedRemoteAsset): string {
	return isFontAsset(asset) ? asset.face.objectKey : asset.license.objectKey;
}

function assetPublicUrl(asset: VerifiedRemoteAsset): string {
	return isFontAsset(asset) ? asset.face.publicUrl : asset.license.publicUrl;
}

export function wranglerPutArguments(
	catalog: FontCdnCatalog,
	bucket: string,
	asset: VerifiedRemoteAsset,
	jurisdiction?: string,
): string[] {
	const contentType = isFontAsset(asset)
		? catalog.delivery.contentType
		: catalog.delivery.licenseContentType;
	const args = [
		"exec",
		"wrangler",
		"r2",
		"object",
		"put",
		`${bucket}/${assetObjectKey(asset)}`,
		"--file",
		asset.localPath,
		"--content-type",
		contentType,
		"--cache-control",
		catalog.delivery.cacheControl,
		"--storage-class",
		catalog.delivery.storageClass,
		"--remote",
		"--force",
	];
	if (jurisdiction) args.push("--jurisdiction", jurisdiction);
	return args;
}

export function parseArguments(args: string[]): CliOptions {
	let mode: CliOptions["mode"] = "preflight";
	let explicitMode: CliOptions["mode"] | undefined;
	let manifestPath = DEFAULT_MANIFEST_PATH;
	let bucket: string | undefined;
	let jurisdiction: string | undefined;
	let help = false;

	for (let index = 0; index < args.length; index += 1) {
		const argument = args[index];
		if (argument === "--preflight" || argument === "--apply") {
			const nextMode = argument === "--apply" ? "apply" : "preflight";
			if (explicitMode && explicitMode !== nextMode) {
				throw new Error("Choose exactly one of --preflight or --apply");
			}
			explicitMode = nextMode;
			mode = nextMode;
			continue;
		}
		if (argument === "--help" || argument === "-h") {
			help = true;
			continue;
		}
		if (
			argument === "--manifest" ||
			argument === "--bucket" ||
			argument === "--jurisdiction"
		) {
			const value = args[index + 1];
			if (!value || value.startsWith("--")) {
				throw new Error(`${argument} requires a value`);
			}
			index += 1;
			if (argument === "--manifest") manifestPath = resolve(value);
			if (argument === "--bucket") bucket = value;
			if (argument === "--jurisdiction") jurisdiction = value;
			continue;
		}
		throw new Error(`Unknown argument: ${argument}`);
	}

	return { mode, manifestPath, bucket, jurisdiction, help };
}

async function defaultCommandRunner(
	command: string,
	args: string[],
): Promise<CommandResult> {
	return await new Promise((resolveResult, reject) => {
		const child = spawn(command, args, {
			cwd: resolve(import.meta.dirname, "../.."),
			env: process.env,
			stdio: ["ignore", "pipe", "pipe"],
		});
		let output = "";
		child.stdout.on("data", (chunk) => {
			output += String(chunk);
		});
		child.stderr.on("data", (chunk) => {
			output += String(chunk);
		});
		child.on("error", reject);
		child.on("close", (exitCode) => {
			resolveResult({ exitCode: exitCode ?? 1, output });
		});
	});
}

function assertBucketName(bucket: string): void {
	if (!SAFE_BUCKET_PATTERN.test(bucket)) {
		throw new Error(
			"R2 bucket name must be lowercase kebab-case and 3-63 characters",
		);
	}
}

export type CloudflareCredentialMode = "api-token" | "global-api-key";

export function validateCloudflareAuthEnvironment(
	environment: NodeJS.ProcessEnv,
): CloudflareCredentialMode {
	const hasToken = Boolean(environment.CLOUDFLARE_API_TOKEN?.trim());
	const hasGlobalKey = Boolean(environment.CLOUDFLARE_API_KEY?.trim());
	const hasEmail = Boolean(environment.CLOUDFLARE_EMAIL?.trim());
	const accountId = environment.CLOUDFLARE_ACCOUNT_ID?.trim();
	if (hasToken && (hasGlobalKey || hasEmail)) {
		throw new Error(
			"Cloudflare authentication is ambiguous; provide either API token or global-key pair, never both",
		);
	}
	if (hasGlobalKey !== hasEmail) {
		throw new Error(
			"Global Cloudflare authentication requires both CLOUDFLARE_API_KEY and CLOUDFLARE_EMAIL",
		);
	}
	if (hasGlobalKey && !/^[a-f0-9]{32}$/.test(accountId ?? "")) {
		throw new Error(
			"Global Cloudflare authentication requires CLOUDFLARE_ACCOUNT_ID from the verified secret metadata",
		);
	}
	if (hasToken) return "api-token";
	if (hasGlobalKey && hasEmail) return "global-api-key";
	throw new Error(
		"Remote bucket preflight or apply requires CLOUDFLARE_API_TOKEN or the complete CLOUDFLARE_API_KEY and CLOUDFLARE_EMAIL pair",
	);
}

async function downloadVerifiedAssets(
	catalog: FontCdnCatalog,
	temporaryDirectory: string,
	fetchImplementation: typeof fetch,
): Promise<VerifiedRemoteAsset[]> {
	const assets: VerifiedRemoteAsset[] = [];
	const repositoryRoot = resolve(import.meta.dirname, "../..");
	for (const family of catalog.families) {
		const localLicensePath = resolve(repositoryRoot, family.license.localPath);
		const localLicenseBytes = new Uint8Array(await readFile(localLicensePath));
		verifyLicenseBytes(family.license, localLicenseBytes);
		let licenseResponse: Response;
		try {
			licenseResponse = await fetchImplementation(family.license.url, {
				headers: { Accept: "text/plain" },
				redirect: "error",
				signal: AbortSignal.timeout(30_000),
			});
		} catch (error) {
			throw new Error(`${family.id} OFL download failed: ${String(error)}`);
		}
		if (!licenseResponse.ok) {
			throw new Error(
				`${family.id} OFL download returned HTTP ${licenseResponse.status}`,
			);
		}
		const sourceLicenseBytes = new Uint8Array(
			await licenseResponse.arrayBuffer(),
		);
		verifyLicenseBytes(family.license, sourceLicenseBytes);
		if (
			localLicenseBytes.length !== sourceLicenseBytes.length ||
			!localLicenseBytes.every(
				(byte, index) => byte === sourceLicenseBytes[index],
			)
		) {
			throw new Error(
				`${family.id} governed OFL artifact differs from its pinned source`,
			);
		}
		assets.push({
			family,
			license: family.license,
			localPath: localLicensePath,
		});
		process.stdout.write(`verified ${family.family} OFL-1.1\n`);

		for (const face of family.faces) {
			let response: Response;
			try {
				response = await fetchImplementation(face.sourceUrl, {
					headers: { Accept: "font/woff2" },
					redirect: "error",
					signal: AbortSignal.timeout(30_000),
				});
			} catch (error) {
				throw new Error(`${face.id} download failed: ${String(error)}`);
			}
			if (!response.ok) {
				throw new Error(`${face.id} download returned HTTP ${response.status}`);
			}
			const bytes = new Uint8Array(await response.arrayBuffer());
			verifyFaceBytes(face, bytes);
			const localPath = join(temporaryDirectory, face.fileName);
			await writeFile(localPath, bytes, { flag: "wx", mode: 0o600 });
			assets.push({ family, face, localPath });
			process.stdout.write(`verified ${family.family} ${face.style}\n`);
		}
	}
	return assets;
}

async function assertRemoteBucket(
	bucket: string,
	jurisdiction: string | undefined,
	runner: CommandRunner,
): Promise<void> {
	const args = ["exec", "wrangler", "r2", "bucket", "info", bucket, "--json"];
	if (jurisdiction) args.push("--jurisdiction", jurisdiction);
	const result = await runner("pnpm", args);
	if (result.exitCode !== 0) {
		throw new Error(
			`Wrangler could not access the dedicated R2 bucket ${bucket}`,
		);
	}
}

function cacheControlDirectives(value: string): Set<string> {
	return new Set(
		value
			.split(",")
			.map((directive) => directive.trim().toLowerCase())
			.filter(Boolean),
	);
}

export function verifyPublicFontHeaders(
	response: Response,
	requestOrigin = FONT_CDN_CORS_PROBE_ORIGIN,
): void {
	const contentType = response.headers
		.get("content-type")
		?.split(";", 1)[0]
		?.trim()
		.toLowerCase();
	if (contentType !== "font/woff2") {
		throw new Error(
			`Public font Content-Type must be font/woff2; received ${contentType ?? "missing"}`,
		);
	}

	verifyPublicImmutableHeaders(response, requestOrigin);
}

export function verifyPublicLicenseHeaders(
	response: Response,
	requestOrigin = FONT_CDN_CORS_PROBE_ORIGIN,
): void {
	const contentType = response.headers
		.get("content-type")
		?.trim()
		.toLowerCase();
	if (contentType !== "text/plain; charset=utf-8") {
		throw new Error(
			`Public license Content-Type must be text/plain; charset=utf-8; received ${contentType ?? "missing"}`,
		);
	}
	verifyPublicImmutableHeaders(response, requestOrigin);
}

function verifyPublicImmutableHeaders(
	response: Response,
	requestOrigin: string,
): void {
	const cacheControl = cacheControlDirectives(
		response.headers.get("cache-control") ?? "",
	);
	for (const requiredDirective of ["public", "max-age=31536000", "immutable"]) {
		if (!cacheControl.has(requiredDirective)) {
			throw new Error(
				`Public font Cache-Control is missing ${requiredDirective}`,
			);
		}
	}

	const allowedOrigin = response.headers.get("access-control-allow-origin");
	if (allowedOrigin !== "*" && allowedOrigin !== requestOrigin) {
		throw new Error(
			`Public font CORS does not allow ${requestOrigin}; received ${allowedOrigin ?? "missing"}`,
		);
	}
}

export async function publicObjectExists(
	asset: VerifiedRemoteAsset,
	fetchImplementation: typeof fetch,
): Promise<boolean> {
	const response = await fetchImplementation(assetPublicUrl(asset), {
		headers: {
			Accept: isFontAsset(asset) ? "font/woff2" : "text/plain",
			Origin: FONT_CDN_CORS_PROBE_ORIGIN,
		},
		redirect: "error",
		signal: AbortSignal.timeout(30_000),
	});
	if (response.status === 404) return false;
	if (!response.ok) {
		throw new Error(
			`Public CDN verification for ${assetObjectKey(asset)} returned HTTP ${response.status}`,
		);
	}
	const bytes = new Uint8Array(await response.arrayBuffer());
	if (isFontAsset(asset)) {
		verifyPublicFontHeaders(response);
		verifyFaceBytes(asset.face, bytes);
	} else {
		verifyPublicLicenseHeaders(response);
		verifyLicenseBytes(asset.license, bytes);
	}
	return true;
}

async function inspectOrSyncRemote(
	catalog: FontCdnCatalog,
	bucket: string,
	assets: VerifiedRemoteAsset[],
	options: CliOptions,
	environment: NodeJS.ProcessEnv,
	runner: CommandRunner,
	fetchImplementation: typeof fetch,
): Promise<void> {
	assertBucketName(bucket);
	if (bucket !== catalog.delivery.r2BucketName) {
		throw new Error(
			`Refusing undeclared bucket ${bucket}; expected ${catalog.delivery.r2BucketName}`,
		);
	}
	validateCloudflareAuthEnvironment(environment);
	await assertRemoteBucket(bucket, options.jurisdiction, runner);
	const submitted: VerifiedRemoteAsset[] = [];

	for (const asset of assets) {
		const exists = await publicObjectExists(asset, fetchImplementation);
		if (exists) {
			process.stdout.write(`present ${assetObjectKey(asset)}\n`);
			continue;
		}
		if (options.mode === "preflight") {
			process.stdout.write(`missing ${assetObjectKey(asset)}\n`);
			continue;
		}

		const putResult = await runner(
			"pnpm",
			wranglerPutArguments(catalog, bucket, asset, options.jurisdiction),
		);
		if (putResult.exitCode !== 0) {
			throw new Error(`Wrangler upload failed for ${assetObjectKey(asset)}`);
		}
		submitted.push(asset);
		process.stdout.write(`submitted ${assetObjectKey(asset)}\n`);
	}

	let pending = submitted;
	for (const delayMilliseconds of [0, 1_000, 2_000, 4_000, 8_000]) {
		if (pending.length === 0) break;
		if (delayMilliseconds > 0) {
			await new Promise((resolveDelay) =>
				setTimeout(resolveDelay, delayMilliseconds),
			);
		}
		const unresolved: VerifiedRemoteAsset[] = [];
		for (const asset of pending) {
			const readable = await publicObjectExists(asset, fetchImplementation);
			if (!readable) unresolved.push(asset);
		}
		pending = unresolved;
	}
	if (pending.length > 0) {
		throw new Error(
			`Uploaded objects are not readable: ${pending.map(assetObjectKey).join(", ")}`,
		);
	}
	for (const asset of submitted) {
		process.stdout.write(`uploaded ${assetObjectKey(asset)}\n`);
	}
}

function printHelp(): void {
	process.stdout.write(`Usage:
  node scripts/fonts/sync-font-cdn.ts [--preflight] [--manifest <path>]
  node scripts/fonts/sync-font-cdn.ts --preflight --bucket <r2-bucket>
  node scripts/fonts/sync-font-cdn.ts --apply --bucket <r2-bucket>

Preflight is the default and never mutates R2. --apply is required to upload.
The bucket can also be supplied as FONT_CDN_R2_BUCKET for --apply only.
Remote operations require either a scoped CLOUDFLARE_API_TOKEN or the complete
CLOUDFLARE_API_KEY and CLOUDFLARE_EMAIL pair documented by AgentOps.
`);
}

export async function run(
	args = process.argv.slice(2),
	dependencies: {
		fetchImplementation?: typeof fetch;
		runner?: CommandRunner;
		environment?: NodeJS.ProcessEnv;
	} = {},
): Promise<void> {
	const options = parseArguments(args);
	if (options.help) {
		printHelp();
		return;
	}
	const environment = dependencies.environment ?? process.env;
	const rawCatalog = JSON.parse(await readFile(options.manifestPath, "utf8"));
	const catalog = validateCatalog(rawCatalog);
	const temporaryDirectory = await mkdtemp(join(tmpdir(), "lemn-font-cdn-"));
	try {
		const assets = await downloadVerifiedAssets(
			catalog,
			temporaryDirectory,
			dependencies.fetchImplementation ?? fetch,
		);
		const fetchImplementation = dependencies.fetchImplementation ?? fetch;
		const bucket =
			options.bucket ??
			(options.mode === "apply" ? environment.FONT_CDN_R2_BUCKET : undefined);
		if (options.mode === "apply" && !bucket) {
			throw new Error(
				"--apply requires --bucket or FONT_CDN_R2_BUCKET after source preflight",
			);
		}
		if (bucket) {
			await inspectOrSyncRemote(
				catalog,
				bucket,
				assets,
				options,
				environment,
				dependencies.runner ?? defaultCommandRunner,
				fetchImplementation,
			);
		}
		process.stdout.write(
			`${options.mode} complete: ${catalog.families.length} families, ${assets.filter(isFontAsset).length} immutable WOFF2 faces, ${assets.filter((asset) => !isFontAsset(asset)).length} exact OFL artifacts${bucket ? `, bucket ${bucket}` : ""}\n`,
		);
	} finally {
		await rm(temporaryDirectory, { recursive: true, force: true });
	}
}

if (
	process.argv[1] &&
	resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
	run().catch((error) => {
		process.stderr.write(
			`${error instanceof Error ? error.message : String(error)}\n`,
		);
		process.exitCode = 1;
	});
}
