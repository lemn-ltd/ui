import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import {
	type AccessApplication,
	type AccessApplicationInput,
	type AccessPolicy,
	type AccessPolicyInput,
	applyZeroTrust,
	type CloudflareAccessPort,
	parseZeroTrustConfig,
	planZeroTrust,
	probeZeroTrust,
} from "./zero-trust.ts";

interface CloudflareEnvelope<T> {
	readonly success: boolean;
	readonly result: T;
	readonly errors?: readonly { readonly code?: number }[];
	readonly result_info?: {
		readonly page?: number;
		readonly total_pages?: number;
	};
}

type Authentication =
	| { readonly kind: "api-token"; readonly token: string }
	| {
			readonly kind: "global-api-key";
			readonly key: string;
			readonly email: string;
	  };

export class CloudflareAccessClient implements CloudflareAccessPort {
	private readonly accountId: string;
	private readonly authentication: Authentication;
	private readonly fetchImplementation: typeof fetch;

	public constructor(
		accountId: string,
		authentication: Authentication,
		fetchImplementation: typeof fetch = fetch,
	) {
		this.accountId = accountId;
		this.authentication = authentication;
		this.fetchImplementation = fetchImplementation;
	}

	public listApplications(): Promise<readonly AccessApplication[]> {
		return this.list<AccessApplication>("/access/apps");
	}

	public createApplication(
		input: AccessApplicationInput,
	): Promise<AccessApplication> {
		return this.request<AccessApplication>("POST", "/access/apps", input);
	}

	public updateApplication(
		applicationId: string,
		input: AccessApplicationInput,
	): Promise<AccessApplication> {
		return this.request<AccessApplication>(
			"PUT",
			`/access/apps/${encodeURIComponent(applicationId)}`,
			input,
		);
	}

	public async deleteApplication(applicationId: string): Promise<void> {
		await this.request<unknown>(
			"DELETE",
			`/access/apps/${encodeURIComponent(applicationId)}`,
		);
	}

	public listPolicies(applicationId: string): Promise<readonly AccessPolicy[]> {
		return this.list<AccessPolicy>(
			`/access/apps/${encodeURIComponent(applicationId)}/policies`,
		);
	}

	public createPolicy(
		applicationId: string,
		input: AccessPolicyInput,
	): Promise<AccessPolicy> {
		return this.request<AccessPolicy>(
			"POST",
			`/access/apps/${encodeURIComponent(applicationId)}/policies`,
			input,
		);
	}

	public updatePolicy(
		applicationId: string,
		policyId: string,
		input: AccessPolicyInput,
	): Promise<AccessPolicy> {
		return this.request<AccessPolicy>(
			"PUT",
			`/access/apps/${encodeURIComponent(applicationId)}/policies/${encodeURIComponent(policyId)}`,
			input,
		);
	}

	public async deletePolicy(
		applicationId: string,
		policyId: string,
	): Promise<void> {
		await this.request<unknown>(
			"DELETE",
			`/access/apps/${encodeURIComponent(applicationId)}/policies/${encodeURIComponent(policyId)}`,
		);
	}

	private async list<T>(path: string): Promise<readonly T[]> {
		const values: T[] = [];
		let page = 1;
		for (;;) {
			const separator = path.includes("?") ? "&" : "?";
			const envelope = await this.requestEnvelope<readonly T[]>(
				"GET",
				`${path}${separator}page=${page}&per_page=100`,
			);
			values.push(...envelope.result);
			const totalPages = envelope.result_info?.total_pages ?? page;
			if (page >= totalPages) return values;
			page += 1;
			if (page > 1_000) {
				throw new Error(
					"Cloudflare pagination exceeded the reconciler safety limit.",
				);
			}
		}
	}

	private async request<T>(
		method: string,
		path: string,
		body?: unknown,
	): Promise<T> {
		return (await this.requestEnvelope<T>(method, path, body)).result;
	}

	private async requestEnvelope<T>(
		method: string,
		path: string,
		body?: unknown,
	): Promise<CloudflareEnvelope<T>> {
		const response = await this.fetchImplementation(
			`https://api.cloudflare.com/client/v4/accounts/${this.accountId}${path}`,
			{
				method,
				headers: this.headers(body !== undefined),
				...(body === undefined ? {} : { body: JSON.stringify(body) }),
			},
		);
		let envelope: CloudflareEnvelope<T> | undefined;
		try {
			envelope = (await response.json()) as CloudflareEnvelope<T>;
		} catch {
			throw new Error(
				`Cloudflare ${method} ${path} returned a non-JSON response (${response.status}).`,
			);
		}
		if (!response.ok || !envelope.success) {
			const errorCode = envelope.errors?.[0]?.code;
			throw new Error(
				`Cloudflare ${method} ${path} failed (${response.status}${errorCode ? `, code ${errorCode}` : ""}).`,
			);
		}
		return envelope;
	}

	private headers(hasBody: boolean): Record<string, string> {
		const headers: Record<string, string> = {
			accept: "application/json",
			...(hasBody ? { "content-type": "application/json" } : {}),
		};
		if (this.authentication.kind === "api-token") {
			headers.authorization = `Bearer ${this.authentication.token}`;
		} else {
			headers["x-auth-key"] = this.authentication.key;
			headers["x-auth-email"] = this.authentication.email;
		}
		return headers;
	}
}

export function selectCloudflareAuthentication(
	environment: NodeJS.ProcessEnv,
): Authentication {
	const token = environment.CLOUDFLARE_API_TOKEN?.trim();
	const key = environment.CLOUDFLARE_API_KEY?.trim();
	const email = environment.CLOUDFLARE_EMAIL?.trim();
	if (token && !key && !email) return { kind: "api-token", token };
	if (!token && key && email) return { kind: "global-api-key", key, email };
	throw new Error(
		"Configure exactly one Cloudflare authentication mode: CLOUDFLARE_API_TOKEN, or CLOUDFLARE_API_KEY with CLOUDFLARE_EMAIL.",
	);
}

export function resolveAccountId(
	environment: NodeJS.ProcessEnv,
	variableName: string,
): string {
	const accountId = environment[variableName]?.trim();
	if (!accountId || !/^[0-9a-f]{32}$/iu.test(accountId)) {
		throw new Error(
			`${variableName} must contain the exact 32-character Cloudflare account id.`,
		);
	}
	return accountId;
}

export function resolveCurrentBranch(
	environment: NodeJS.ProcessEnv,
	workingDirectory = process.cwd(),
): string | undefined {
	const explicit = environment.GITHUB_REF_NAME?.trim();
	if (explicit) return explicit;
	try {
		return execFileSync("git", ["symbolic-ref", "--quiet", "--short", "HEAD"], {
			cwd: workingDirectory,
			encoding: "utf8",
			stdio: ["ignore", "pipe", "ignore"],
		}).trim();
	} catch {
		return undefined;
	}
}

interface Arguments {
	readonly action: "plan" | "apply";
	readonly environment: string;
	readonly manifestPath: string;
	readonly confirmProject?: string;
}

export function parseArguments(argv: readonly string[]): Arguments {
	const action = argv[0];
	if (action !== "plan" && action !== "apply") {
		throw new Error(
			"Usage: reconcile-zero-trust.ts <plan|apply> --environment <name> [--confirm-project <id>].",
		);
	}
	let environment: string | undefined;
	let manifestPath = "tooling/manifests/infrastructure/zero-trust.json";
	let confirmProject: string | undefined;
	for (let index = 1; index < argv.length; index += 1) {
		const argument = argv[index];
		const value = argv[index + 1];
		if (argument === "--environment" && value) {
			environment = value;
			index += 1;
		} else if (argument === "--manifest" && value) {
			manifestPath = value;
			index += 1;
		} else if (argument === "--confirm-project" && value) {
			confirmProject = value;
			index += 1;
		} else {
			throw new Error(
				`Unsupported or incomplete argument: ${argument ?? "<missing>"}.`,
			);
		}
	}
	if (!environment) throw new Error("--environment is required.");
	return {
		action,
		environment,
		manifestPath,
		...(confirmProject ? { confirmProject } : {}),
	};
}

export async function runCli(
	argv: readonly string[],
	processEnvironment: NodeJS.ProcessEnv = process.env,
): Promise<unknown> {
	const args = parseArguments(argv);
	const manifestPath = resolve(process.cwd(), args.manifestPath);
	const config = parseZeroTrustConfig(
		JSON.parse(await readFile(manifestPath, "utf8")) as unknown,
	);
	const environment = config.environments[args.environment];
	if (!environment)
		throw new Error(
			`Environment ${args.environment} is not declared by ${config.projectId}.`,
		);
	if (args.action === "apply") {
		const branch = resolveCurrentBranch(processEnvironment);
		if (branch !== environment.sourceBranch) {
			throw new Error(
				`Environment ${args.environment} is released only from ${environment.sourceBranch}, not ${branch ?? "a detached or unknown ref"}.`,
			);
		}
		if (args.confirmProject !== config.projectId) {
			throw new Error(`Apply requires --confirm-project ${config.projectId}.`);
		}
	}
	const accountId = resolveAccountId(
		processEnvironment,
		environment.cloudflare.accountIdEnv,
	);
	const access = new CloudflareAccessClient(
		accountId,
		selectCloudflareAuthentication(processEnvironment),
	);
	if (args.action === "plan") {
		return {
			status: "planned",
			plan: await planZeroTrust({
				config,
				environmentName: args.environment,
				processEnvironment,
				access,
			}),
		};
	}
	const result = await applyZeroTrust({
		config,
		environmentName: args.environment,
		processEnvironment,
		access,
	});
	const probes = await probeZeroTrust({
		config,
		environmentName: args.environment,
	});
	const failures = probes.filter((probe) => !probe.passed);
	if (failures.length > 0) {
		throw new Error(
			`Cloudflare Access converged, but ${failures.length} deployed boundary probe(s) failed.`,
		);
	}
	return { status: "applied", ...result, probes };
}

function isMainModule(): boolean {
	const entrypoint = process.argv[1];
	return Boolean(
		entrypoint && pathToFileURL(resolve(entrypoint)).href === import.meta.url,
	);
}

if (isMainModule()) {
	runCli(process.argv.slice(2)).then(
		(result) => {
			process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
		},
		(error: unknown) => {
			const message =
				error instanceof Error ? error.message : "Unknown reconciler failure.";
			process.stderr.write(`${JSON.stringify({ status: "error", message })}\n`);
			process.exitCode = 1;
		},
	);
}
