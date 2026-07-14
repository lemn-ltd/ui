#!/usr/bin/env node
import { appendFile, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { type ParseError, parse, printParseErrorCode } from "jsonc-parser";

const CLOUDFLARE_API = "https://api.cloudflare.com/client/v4";
const EXPECTED_ACCOUNT_NAME = "Lemn DEV";
const EXPECTED_ZONE_NAME = "le-mn.com";

interface WranglerRoute {
	pattern?: string;
	custom_domain?: boolean;
}

interface WranglerEnvironment {
	account_id?: string;
	name?: string;
	routes?: WranglerRoute[];
}

interface WranglerConfig extends WranglerEnvironment {
	env?: Record<string, WranglerEnvironment>;
}

export interface CloudflareReleaseTarget {
	id: "docs" | "showcase";
	accountId: string;
	workerName: string;
	hostname: string;
}

interface CloudflareEnvelope<T> {
	success?: boolean;
	result?: T;
	errors?: Array<{ code?: number; message?: string }>;
}

interface MembershipPolicy {
	access?: string;
	permission_groups?: Array<{ name?: string }>;
}

interface Membership {
	id?: string;
	account?: { id?: string };
	api_access_enabled?: boolean;
	policies?: MembershipPolicy[];
	roles?: Array<string | { name?: string }>;
	status?: string;
}

interface CloudflareAuth {
	apiKey: string;
	email: string;
}

type FetchImplementation = typeof fetch;

function requireValue(value: string | undefined, description: string): string {
	if (!value) throw new Error(`Missing ${description}`);
	return value;
}

async function readWranglerConfig(path: string): Promise<WranglerConfig> {
	const source = await readFile(path, "utf8");
	const errors: ParseError[] = [];
	const config = parse(source, errors, { allowTrailingComma: true }) as
		| WranglerConfig
		| undefined;
	if (!config || errors.length > 0) {
		const details = errors
			.map((error) => printParseErrorCode(error.error))
			.join(", ");
		throw new Error(
			`Invalid Wrangler JSONC at ${path}: ${details || "empty config"}`,
		);
	}
	return config;
}

function targetFromConfig(
	id: CloudflareReleaseTarget["id"],
	config: WranglerConfig,
	environment?: string,
): CloudflareReleaseTarget {
	const selected = environment ? config.env?.[environment] : undefined;
	if (environment && !selected)
		throw new Error(`Missing Wrangler environment ${environment} for ${id}`);

	const routes = selected?.routes ?? config.routes ?? [];
	const customDomains = routes.filter(
		(route) => route.custom_domain === true && route.pattern,
	);
	if (customDomains.length !== 1) {
		throw new Error(
			`${id} must declare exactly one custom domain; received ${customDomains.length}`,
		);
	}

	return {
		id,
		accountId: requireValue(
			selected?.account_id ?? config.account_id,
			`${id} account_id`,
		),
		workerName: requireValue(
			selected?.name ?? config.name,
			`${id} Worker name`,
		),
		hostname: requireValue(customDomains[0]?.pattern, `${id} custom domain`),
	};
}

export async function loadCloudflareReleaseTargets(
	root = resolve(import.meta.dirname, "../.."),
): Promise<CloudflareReleaseTarget[]> {
	const [docs, showcase] = await Promise.all([
		readWranglerConfig(resolve(root, "apps/docs/wrangler.jsonc")),
		readWranglerConfig(resolve(root, "apps/showcase/wrangler.jsonc")),
	]);

	return [
		targetFromConfig("docs", docs),
		targetFromConfig("showcase", showcase, "production"),
	];
}

function redact(message: string, auth: CloudflareAuth): string {
	return message
		.replaceAll(auth.apiKey, "[REDACTED]")
		.replaceAll(auth.email, "[REDACTED]");
}

function requireArrayResult(value: unknown, description: string): unknown[] {
	if (!Array.isArray(value)) {
		throw new Error(`Cloudflare preflight returned malformed ${description}`);
	}
	return value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return value !== null && typeof value === "object" && !Array.isArray(value);
}

function requireWorkerList(
	value: unknown,
	description: string,
): Array<{ id: string }> {
	const workers = requireArrayResult(value, description);
	if (
		workers.some(
			(worker) =>
				!isRecord(worker) ||
				typeof worker.id !== "string" ||
				worker.id.trim().length === 0,
		)
	) {
		throw new Error(`Cloudflare preflight returned malformed ${description}`);
	}
	return workers as Array<{ id: string }>;
}

function requireDomainList(
	value: unknown,
	description: string,
): Array<{ hostname: string; service: string }> {
	const domains = requireArrayResult(value, description);
	if (
		domains.some(
			(domain) =>
				!isRecord(domain) ||
				typeof domain.hostname !== "string" ||
				domain.hostname.trim().length === 0 ||
				typeof domain.service !== "string" ||
				domain.service.trim().length === 0,
		)
	) {
		throw new Error(`Cloudflare preflight returned malformed ${description}`);
	}
	return domains as Array<{ hostname: string; service: string }>;
}

async function cloudflareRequest<T>(
	path: string,
	auth: CloudflareAuth,
	fetchImplementation: FetchImplementation,
): Promise<T> {
	let response: Response;
	try {
		response = await fetchImplementation(`${CLOUDFLARE_API}${path}`, {
			headers: {
				"X-Auth-Email": auth.email,
				"X-Auth-Key": auth.apiKey,
			},
			signal: AbortSignal.timeout(15_000),
		});
	} catch (error) {
		throw new Error(
			`Cloudflare preflight request failed for ${path}: ${redact(String(error), auth)}`,
		);
	}

	let envelope: CloudflareEnvelope<T>;
	try {
		envelope = (await response.json()) as CloudflareEnvelope<T>;
	} catch {
		throw new Error(
			`Cloudflare preflight returned non-JSON HTTP ${response.status} for ${path}`,
		);
	}

	if (
		!response.ok ||
		envelope.success !== true ||
		envelope.result === undefined
	) {
		const errors = (envelope.errors ?? [])
			.map(
				(error) =>
					`${error.code ?? "unknown"} ${error.message ?? "Cloudflare API error"}`,
			)
			.join("; ");
		throw new Error(
			`Cloudflare preflight rejected ${path} with HTTP ${response.status}${errors ? `: ${redact(errors, auth)}` : ""}`,
		);
	}

	return envelope.result;
}

function membershipRoleNames(membership: Membership): string[] {
	return (membership.roles ?? []).flatMap((role) => {
		if (typeof role === "string") return [role];
		return role.name ? [role.name] : [];
	});
}

function assertDeploymentPermissions(membership: Membership): void {
	const allowed = (membership.policies ?? [])
		.filter((policy) => policy.access?.toLowerCase() === "allow")
		.flatMap((policy) => policy.permission_groups ?? [])
		.flatMap((group) => (group.name ? [group.name] : []));
	const denied = (membership.policies ?? [])
		.filter((policy) => policy.access?.toLowerCase() === "deny")
		.flatMap((policy) => policy.permission_groups ?? [])
		.flatMap((group) => (group.name ? [group.name] : []));
	const adminRole = membershipRoleNames(membership).some((name) =>
		/(?:super|account) administrator/iu.test(name),
	);
	const scriptsWrite = allowed.some((name) =>
		/^Workers Scripts (?:Write|Edit)$/iu.test(name),
	);
	const scriptsDenied = denied.some((name) =>
		/^Workers Scripts (?:Write|Edit)$/iu.test(name),
	);

	if (scriptsDenied || (!adminRole && !scriptsWrite)) {
		throw new Error(
			"Cloudflare account membership lacks Workers Scripts Write permission",
		);
	}
}

export async function verifyCloudflareReleaseAccess(input: {
	apiKey: string;
	email: string;
	targets: CloudflareReleaseTarget[];
	fetchImplementation?: FetchImplementation;
	requireResources?: boolean;
}): Promise<void> {
	const auth = {
		apiKey: requireValue(input.apiKey, "CLOUDFLARE_API_KEY"),
		email: requireValue(input.email, "CLOUDFLARE_EMAIL"),
	};
	const fetchImplementation = input.fetchImplementation ?? fetch;
	const accounts = new Set(input.targets.map((target) => target.accountId));
	if (accounts.size !== 1) {
		throw new Error(
			"Docs and showcase must deploy through the same configured Cloudflare account",
		);
	}
	const accountId = requireValue([...accounts][0], "release account id");

	const user = await cloudflareRequest<{ email?: string }>(
		"/user",
		auth,
		fetchImplementation,
	);
	if (user.email?.toLowerCase() !== auth.email.toLowerCase()) {
		throw new Error("CLOUDFLARE_EMAIL does not match the Global API Key owner");
	}

	const memberships = requireArrayResult(
		await cloudflareRequest<Membership[]>(
			"/memberships",
			auth,
			fetchImplementation,
		),
		"membership list",
	);
	const membership = (memberships as Membership[]).find(
		(candidate) => candidate.account?.id === accountId,
	);
	const membershipId = requireValue(
		membership?.id,
		`accepted membership for account ${accountId}`,
	);
	if (
		membership?.status !== "accepted" ||
		membership.api_access_enabled === false
	) {
		throw new Error(
			`Cloudflare API access is not active for account ${accountId}`,
		);
	}

	const membershipDetails = await cloudflareRequest<Membership>(
		`/memberships/${encodeURIComponent(membershipId)}`,
		auth,
		fetchImplementation,
	);
	assertDeploymentPermissions(membershipDetails);
	const account = await cloudflareRequest<{ id?: string; name?: string }>(
		`/accounts/${encodeURIComponent(accountId)}`,
		auth,
		fetchImplementation,
	);
	if (account.id !== accountId || account.name !== EXPECTED_ACCOUNT_NAME) {
		throw new Error(
			`Configured Cloudflare account is not ${EXPECTED_ACCOUNT_NAME}`,
		);
	}

	const zoneQuery = new URLSearchParams({
		name: EXPECTED_ZONE_NAME,
		"account.id": accountId,
		status: "active",
	});
	const zones = requireArrayResult(
		await cloudflareRequest<
			Array<{ id?: string; name?: string; account?: { id?: string } }>
		>(`/zones?${zoneQuery}`, auth, fetchImplementation),
		"zone list",
	);
	if (
		!(
			zones as Array<{ id?: string; name?: string; account?: { id?: string } }>
		).some(
			(zone) =>
				zone.name === EXPECTED_ZONE_NAME && zone.account?.id === accountId,
		)
	) {
		throw new Error(
			`${EXPECTED_ACCOUNT_NAME} cannot manage the ${EXPECTED_ZONE_NAME} zone required by the release domains`,
		);
	}

	for (const target of input.targets) {
		const scripts = requireWorkerList(
			await cloudflareRequest<Array<{ id?: string }>>(
				`/accounts/${encodeURIComponent(target.accountId)}/workers/scripts`,
				auth,
				fetchImplementation,
			),
			`Worker list for ${target.id}`,
		);
		if (
			input.requireResources &&
			!scripts.some((script) => script.id === target.workerName)
		) {
			throw new Error(
				`Cloudflare account for ${target.id} does not contain Worker ${target.workerName}`,
			);
		}

		const query = new URLSearchParams({ hostname: target.hostname });
		const domains = requireDomainList(
			await cloudflareRequest<Array<{ hostname?: string; service?: string }>>(
				`/accounts/${encodeURIComponent(target.accountId)}/workers/domains?${query}`,
				auth,
				fetchImplementation,
			),
			`custom-domain list for ${target.id}`,
		);
		const hostnameMappings = domains.filter(
			(domain) => domain.hostname === target.hostname,
		);
		const exactMapping = hostnameMappings.some(
			(domain) => domain.service === target.workerName,
		);
		if (hostnameMappings.length > 0 && !exactMapping) {
			throw new Error(
				`Cloudflare hostname ${target.hostname} is already mapped to another Worker`,
			);
		}
		if (input.requireResources && !exactMapping) {
			throw new Error(
				`Cloudflare account for ${target.id} does not map ${target.hostname} to ${target.workerName}`,
			);
		}
	}
}

export function githubOutputs(targets: CloudflareReleaseTarget[]): string {
	return `${targets.map((target) => `${target.id}_account_id=${target.accountId}`).join("\n")}\n`;
}

async function main(): Promise<void> {
	const targets = await loadCloudflareReleaseTargets();
	const requireResources = process.argv.includes("--require-resources");
	await verifyCloudflareReleaseAccess({
		apiKey: process.env.CLOUDFLARE_API_KEY ?? "",
		email: process.env.CLOUDFLARE_EMAIL ?? "",
		targets,
		requireResources,
	});

	if (process.env.GITHUB_OUTPUT) {
		await appendFile(process.env.GITHUB_OUTPUT, githubOutputs(targets), {
			encoding: "utf8",
			mode: 0o600,
		});
	}
	console.log(
		`Cloudflare release ${requireResources ? "resource smoke" : "credential preflight"} passed for ${targets
			.map((target) => target.id)
			.join(" and ")}`,
	);
}

if (import.meta.url === `file://${process.argv[1]}`) {
	await main();
}
