import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import test from "node:test";

import {
	CloudflareAccessClient,
	parseArguments,
	resolveAccountId,
	resolveCurrentBranch,
	runCli,
	selectCloudflareAuthentication,
} from "../../../src/ops/reconcile-zero-trust.ts";
import {
	type AccessApplication,
	type AccessApplicationInput,
	type AccessPolicy,
	type AccessPolicyInput,
	applyZeroTrust,
	type CloudflareAccessPort,
	managedApplicationPrefix,
	parseZeroTrustConfig,
	planZeroTrust,
	probeVerdict,
	probeZeroTrust,
	type ZeroTrustConfig,
} from "../../../src/ops/zero-trust.ts";

const serviceTokenId = "b3c81fb4-2c82-4f10-a32c-6e8f4cc3d7bd";

class FakeAccess implements CloudflareAccessPort {
	public applications: AccessApplication[];
	public policies = new Map<string, AccessPolicy[]>();
	public mutations: string[] = [];
	private nextId = 1;

	public constructor(applications: readonly AccessApplication[] = []) {
		this.applications = structuredClone(applications) as AccessApplication[];
	}

	public async listApplications(): Promise<readonly AccessApplication[]> {
		return structuredClone(this.applications);
	}

	public async createApplication(
		input: AccessApplicationInput,
	): Promise<AccessApplication> {
		const id = `app-${this.nextId++}`;
		const application: AccessApplication = {
			id,
			...structuredClone(input),
			aud: `${"a".repeat(63)}${this.nextId % 10}`,
		};
		this.applications.push(application);
		this.policies.set(id, []);
		this.mutations.push(`create-app:${input.name}`);
		return structuredClone(application);
	}

	public async updateApplication(
		applicationId: string,
		input: AccessApplicationInput,
	): Promise<AccessApplication> {
		const index = this.applications.findIndex(
			(application) => application.id === applicationId,
		);
		assert.notEqual(index, -1);
		const previous = this.applications[index]!;
		const application: AccessApplication = {
			id: applicationId,
			...structuredClone(input),
			...(previous.aud ? { aud: previous.aud } : {}),
		};
		this.applications[index] = application;
		this.mutations.push(`update-app:${input.name}`);
		return structuredClone(application);
	}

	public async deleteApplication(applicationId: string): Promise<void> {
		const application = this.applications.find(
			(candidate) => candidate.id === applicationId,
		);
		assert.ok(application);
		this.applications = this.applications.filter(
			(candidate) => candidate.id !== applicationId,
		);
		this.policies.delete(applicationId);
		this.mutations.push(`delete-app:${application.name}`);
	}

	public async listPolicies(
		applicationId: string,
	): Promise<readonly AccessPolicy[]> {
		return structuredClone(this.policies.get(applicationId) ?? []);
	}

	public async createPolicy(
		applicationId: string,
		input: AccessPolicyInput,
	): Promise<AccessPolicy> {
		const policy: AccessPolicy = {
			id: `policy-${this.nextId++}`,
			...structuredClone(input),
		};
		this.policies.set(applicationId, [
			...(this.policies.get(applicationId) ?? []),
			policy,
		]);
		this.mutations.push(`create-policy:${input.name}`);
		return structuredClone(policy);
	}

	public async updatePolicy(
		applicationId: string,
		policyId: string,
		input: AccessPolicyInput,
	): Promise<AccessPolicy> {
		const policies = this.policies.get(applicationId) ?? [];
		const index = policies.findIndex((policy) => policy.id === policyId);
		assert.notEqual(index, -1);
		const policy: AccessPolicy = { id: policyId, ...structuredClone(input) };
		policies[index] = policy;
		this.policies.set(applicationId, policies);
		this.mutations.push(`update-policy:${input.name}`);
		return structuredClone(policy);
	}

	public async deletePolicy(
		applicationId: string,
		policyId: string,
	): Promise<void> {
		const policies = this.policies.get(applicationId) ?? [];
		const policy = policies.find((candidate) => candidate.id === policyId);
		assert.ok(policy);
		this.policies.set(
			applicationId,
			policies.filter((candidate) => candidate.id !== policyId),
		);
		this.mutations.push(`delete-policy:${policy.name}`);
	}
}

function rawConfig(enabled = false): Record<string, unknown> {
	return {
		version: 1,
		projectId: "sample-project",
		environments: {
			production: {
				sourceBranch: "main",
				enabled,
				cloudflare: {
					accountIdEnv: "CLOUDFLARE_ACCOUNT_ID",
					teamDomainEnv: "CLOUDFLARE_ACCESS_TEAM_DOMAIN",
				},
				policies: {
					humans: {
						type: "human",
						emailsEnv: "ACCESS_ALLOWED_EMAILS",
					},
					automation: {
						type: "service",
						serviceTokenIdsEnv: "ACCESS_SERVICE_TOKEN_IDS",
						requireServiceAuth401: true,
					},
				},
				applications: [
					{
						id: "dashboard",
						hostname: "dashboard.example.com",
						sessionDuration: "24h",
						origin: {
							workerName: "sample-worker",
							enabledVariable: "EDGE_ACCESS_ENABLED",
							issuerVariable: "ACCESS_ISSUER",
						},
						publicProbePaths: ["/health"],
						boundaries: [
							{
								id: "admin",
								paths: ["/admin", "/admin/*"],
								probePath: "/admin/session",
								policyIds: ["humans", "automation"],
								audienceVariable: "ACCESS_AUD",
								whenDisabled: "origin-deny",
							},
						],
					},
				],
			},
		},
	};
}

function config(enabled = false): ZeroTrustConfig {
	return parseZeroTrustConfig(rawConfig(enabled));
}

function enabledEnvironment(): NodeJS.ProcessEnv {
	return {
		ACCESS_ALLOWED_EMAILS: "operator@example.com,second@example.com",
		ACCESS_SERVICE_TOKEN_IDS: serviceTokenId,
	};
}

test("disabled environment plans deletion only for project-owned applications", async () => {
	const prefix = managedApplicationPrefix("sample-project", "production");
	const access = new FakeAccess([
		{
			id: "owned",
			name: `${prefix}old:boundary`,
			type: "self_hosted",
			domain: "old.example.com",
		},
		{
			id: "foreign",
			name: "foreign-app",
			type: "self_hosted",
			domain: "foreign.example.com",
		},
	]);
	const plan = await planZeroTrust({
		config: config(false),
		environmentName: "production",
		processEnvironment: {},
		access,
	});
	assert.deepEqual(plan.actions, [
		{
			kind: "delete-application",
			application: `${prefix}old:boundary`,
			domain: "old.example.com",
		},
	]);
	assert.deepEqual(plan.originProjection, [
		{
			workerName: "sample-worker",
			variables: {
				ACCESS_AUD: "",
				ACCESS_ISSUER: "",
				EDGE_ACCESS_ENABLED: "false",
			},
		},
	]);
});

test("disabled apply removes owned applications, preserves foreign state, and converges idempotently", async () => {
	const prefix = managedApplicationPrefix("sample-project", "production");
	const access = new FakeAccess([
		{
			id: "owned",
			name: `${prefix}old:boundary`,
			type: "self_hosted",
			domain: "old.example.com",
		},
		{
			id: "foreign",
			name: "foreign-app",
			type: "self_hosted",
			domain: "foreign.example.com",
		},
	]);
	const first = await applyZeroTrust({
		config: config(false),
		environmentName: "production",
		processEnvironment: {},
		access,
	});
	assert.equal(first.applied.actions.length, 1);
	assert.equal(first.converged.actions.length, 0);
	assert.deepEqual(
		access.applications.map((application) => application.name),
		["foreign-app"],
	);
	const second = await applyZeroTrust({
		config: config(false),
		environmentName: "production",
		processEnvironment: {},
		access,
	});
	assert.equal(second.applied.actions.length, 0);
});

test("enabled apply creates one boundary application with human and Service Auth policies", async () => {
	const access = new FakeAccess();
	const result = await applyZeroTrust({
		config: config(true),
		environmentName: "production",
		processEnvironment: enabledEnvironment(),
		access,
	});
	assert.equal(
		result.applied.actions.filter(
			(action) => action.kind === "create-application",
		).length,
		1,
	);
	assert.equal(
		result.applied.actions.filter((action) => action.kind === "create-policy")
			.length,
		2,
	);
	assert.equal(result.converged.actions.length, 0);
	const application = access.applications[0]!;
	assert.equal(application.domain, "dashboard.example.com/admin");
	assert.equal(application.service_auth_401_redirect, true);
	assert.deepEqual(application.destinations, [
		{ type: "public", uri: "dashboard.example.com/admin" },
		{ type: "public", uri: "dashboard.example.com/admin/*" },
	]);
	const policies = access.policies.get(application.id)!;
	assert.deepEqual(
		policies.map((policy) => policy.decision),
		["allow", "non_identity"],
	);
	assert.deepEqual(policies[0]!.include, [
		{ email: { email: "operator@example.com" } },
		{ email: { email: "second@example.com" } },
	]);
	assert.deepEqual(policies[1]!.include, [
		{ service_token: { token_id: serviceTokenId } },
	]);
});

test("application and policy drift are updated without replacement", async () => {
	const access = new FakeAccess();
	await applyZeroTrust({
		config: config(true),
		environmentName: "production",
		processEnvironment: enabledEnvironment(),
		access,
	});
	const application = access.applications[0]!;
	access.applications[0] = { ...application, session_duration: "1h" };
	const policy = access.policies.get(application.id)![0]!;
	access.policies.set(application.id, [
		{ ...policy, include: [{ email: { email: "wrong@example.com" } }] },
		access.policies.get(application.id)![1]!,
	]);
	const plan = await planZeroTrust({
		config: config(true),
		environmentName: "production",
		processEnvironment: enabledEnvironment(),
		access,
	});
	assert.ok(
		plan.actions.some((action) => action.kind === "update-application"),
	);
	assert.ok(plan.actions.some((action) => action.kind === "update-policy"));
	await applyZeroTrust({
		config: config(true),
		environmentName: "production",
		processEnvironment: enabledEnvironment(),
		access,
	});
	assert.equal(access.applications[0]!.id, application.id);
});

test("partially disabled application is removed while its environment remains enabled", async () => {
	const raw = rawConfig(true);
	const applications = (
		raw.environments as Record<string, Record<string, unknown>>
	).production!.applications as Record<string, unknown>[];
	applications[0]!.enabled = false;
	const parsed = parseZeroTrustConfig(raw);
	const access = new FakeAccess([
		{
			id: "owned",
			name: `${managedApplicationPrefix("sample-project", "production")}dashboard:admin`,
			type: "self_hosted",
			domain: "dashboard.example.com/admin",
		},
	]);
	const plan = await planZeroTrust({
		config: parsed,
		environmentName: "production",
		processEnvironment: {},
		access,
	});
	assert.deepEqual(
		plan.actions.map((action) => action.kind),
		["delete-application"],
	);
});

test("foreign policies inside an owned application fail closed", async () => {
	const access = new FakeAccess();
	await applyZeroTrust({
		config: config(true),
		environmentName: "production",
		processEnvironment: enabledEnvironment(),
		access,
	});
	const application = access.applications[0]!;
	access.policies.set(application.id, [
		...(access.policies.get(application.id) ?? []),
		{
			id: "foreign-policy",
			name: "dashboard-bypass",
			decision: "bypass",
			include: [{ everyone: {} }],
		},
	]);
	await assert.rejects(
		planZeroTrust({
			config: config(true),
			environmentName: "production",
			processEnvironment: enabledEnvironment(),
			access,
		}),
		/contains foreign policy/u,
	);
});

test("an exact destination owned by another application is never adopted implicitly", async () => {
	const access = new FakeAccess([
		{
			id: "foreign",
			name: "manually-created-dashboard",
			type: "self_hosted",
			domain: "dashboard.example.com/admin",
			destinations: [{ type: "public", uri: "dashboard.example.com/admin" }],
		},
	]);
	await assert.rejects(
		planZeroTrust({
			config: config(true),
			environmentName: "production",
			processEnvironment: enabledEnvironment(),
			access,
		}),
		/already owned by foreign Access application/u,
	);
});

test("a broader foreign destination blocks a narrower managed boundary", async () => {
	const access = new FakeAccess([
		{
			id: "foreign",
			name: "manually-created-dashboard",
			type: "self_hosted",
			domain: "dashboard.example.com",
			destinations: [{ type: "public", uri: "dashboard.example.com" }],
		},
	]);
	await assert.rejects(
		planZeroTrust({
			config: config(true),
			environmentName: "production",
			processEnvironment: enabledEnvironment(),
			access,
		}),
		/already owned by foreign Access application/u,
	);
});

test("duplicate Cloudflare application names fail closed", async () => {
	const name = `${managedApplicationPrefix("sample-project", "production")}dashboard:admin`;
	const access = new FakeAccess([
		{ id: "one", name, type: "self_hosted", domain: "one.example.com" },
		{ id: "two", name, type: "self_hosted", domain: "two.example.com" },
	]);
	await assert.rejects(
		planZeroTrust({
			config: config(false),
			environmentName: "production",
			processEnvironment: {},
			access,
		}),
		/duplicate Access application name/u,
	);
});

test("service-token environment is required only when its boundary is enabled", async () => {
	await planZeroTrust({
		config: config(false),
		environmentName: "production",
		processEnvironment: {},
		access: new FakeAccess(),
	});
	await assert.rejects(
		planZeroTrust({
			config: config(true),
			environmentName: "production",
			processEnvironment: { ACCESS_ALLOWED_EMAILS: "operator@example.com" },
			access: new FakeAccess(),
		}),
		/ACCESS_SERVICE_TOKEN_IDS/u,
	);
});

test("human selectors support exact emails, domains, and Access groups", async () => {
	const raw = rawConfig(true);
	const policies = (raw.environments as Record<string, Record<string, unknown>>)
		.production!.policies as Record<string, Record<string, unknown>>;
	policies.humans = {
		type: "human",
		emails: ["owner@example.com"],
		emailDomains: ["example.org"],
		accessGroupIds: ["3fd2a8d8-9db3-4a39-aa6e-019c56ee0a14"],
	};
	const access = new FakeAccess();
	await applyZeroTrust({
		config: parseZeroTrustConfig(raw),
		environmentName: "production",
		processEnvironment: { ACCESS_SERVICE_TOKEN_IDS: serviceTokenId },
		access,
	});
	assert.deepEqual(
		access.policies.get(access.applications[0]!.id)![0]!.include,
		[
			{ email: { email: "owner@example.com" } },
			{ email_domain: { domain: "example.org" } },
			{ group: { id: "3fd2a8d8-9db3-4a39-aa6e-019c56ee0a14" } },
		],
	);
});

test("origin projection emits pending audiences before create and allocated audiences after apply", async () => {
	const access = new FakeAccess();
	const before = await planZeroTrust({
		config: config(true),
		environmentName: "production",
		processEnvironment: enabledEnvironment(),
		access,
	});
	assert.equal(before.originProjection[0]!.variables.ACCESS_AUD, "<pending>");
	const after = await applyZeroTrust({
		config: config(true),
		environmentName: "production",
		processEnvironment: enabledEnvironment(),
		access,
	});
	assert.match(
		after.converged.originProjection[0]!.variables.ACCESS_AUD!,
		/^[a-z0-9]{64}$/u,
	);
	assert.equal(
		after.converged.originProjection[0]!.variables.EDGE_ACCESS_ENABLED,
		"true",
	);
	assert.equal(
		after.converged.originProjection[0]!.variables.ACCESS_ISSUER,
		"env:CLOUDFLARE_ACCESS_TEAM_DOMAIN",
	);
});

test("strict contract rejects unsupported, dangerous, and ambiguous shapes", async (context) => {
	const cases: readonly [
		string,
		(raw: Record<string, unknown>) => void,
		RegExp,
	][] = [
		[
			"wrong version",
			(raw) => {
				raw.version = 2;
			},
			/version must be 1/u,
		],
		[
			"unknown root key",
			(raw) => {
				raw.mode = "bypass";
			},
			/unsupported keys/u,
		],
		[
			"bypass policy",
			(raw) => {
				const policies = (
					raw.environments as Record<string, Record<string, unknown>>
				).production!.policies as Record<string, Record<string, unknown>>;
				policies.humans = { type: "bypass" };
			},
			/bypass is not supported/u,
		],
		[
			"empty human policy",
			(raw) => {
				const policies = (
					raw.environments as Record<string, Record<string, unknown>>
				).production!.policies as Record<string, Record<string, unknown>>;
				policies.humans = { type: "human" };
			},
			/at least one exact human selector/u,
		],
		[
			"invalid service env",
			(raw) => {
				const policies = (
					raw.environments as Record<string, Record<string, unknown>>
				).production!.policies as Record<string, Record<string, unknown>>;
				policies.automation!.serviceTokenIdsEnv = "bad-name";
			},
			/uppercase environment-variable/u,
		],
		[
			"unknown policy reference",
			(raw) => {
				const apps = (
					raw.environments as Record<string, Record<string, unknown>>
				).production!.applications as Record<string, unknown>[];
				(
					(apps[0]!.boundaries as Record<string, unknown>[])[0]!
						.policyIds as string[]
				)[0] = "missing";
			},
			/unknown policy/u,
		],
		[
			"probe outside path",
			(raw) => {
				const apps = (
					raw.environments as Record<string, Record<string, unknown>>
				).production!.applications as Record<string, unknown>[];
				(apps[0]!.boundaries as Record<string, unknown>[])[0]!.probePath =
					"/other";
			},
			/must be covered/u,
		],
		[
			"wildcard probe",
			(raw) => {
				const apps = (
					raw.environments as Record<string, Record<string, unknown>>
				).production!.applications as Record<string, unknown>[];
				(apps[0]!.boundaries as Record<string, unknown>[])[0]!.probePath =
					"/admin/*";
			},
			/must be concrete/u,
		],
		[
			"unsupported probe method",
			(raw) => {
				const apps = (
					raw.environments as Record<string, Record<string, unknown>>
				).production!.applications as Record<string, unknown>[];
				(apps[0]!.boundaries as Record<string, unknown>[])[0]!.probeMethod =
					"DELETE";
			},
			/must be GET or POST/u,
		],
		[
			"middle wildcard",
			(raw) => {
				const apps = (
					raw.environments as Record<string, Record<string, unknown>>
				).production!.applications as Record<string, unknown>[];
				(apps[0]!.boundaries as Record<string, unknown>[])[0]!.paths = [
					"/ad*min",
				];
			},
			/trailing wildcard/u,
		],
		[
			"duplicate path",
			(raw) => {
				const apps = (
					raw.environments as Record<string, Record<string, unknown>>
				).production!.applications as Record<string, unknown>[];
				(apps[0]!.boundaries as Record<string, unknown>[])[0]!.paths = [
					"/admin",
					"/admin",
				];
			},
			/must not contain duplicates/u,
		],
		[
			"overlapping boundaries",
			(raw) => {
				const apps = (
					raw.environments as Record<string, Record<string, unknown>>
				).production!.applications as Record<string, unknown>[];
				(apps[0]!.boundaries as Record<string, unknown>[]).push({
					id: "reports",
					paths: ["/admin/reports/*"],
					probePath: "/admin/reports/summary",
					policyIds: ["humans"],
					whenDisabled: "origin-deny",
				});
			},
			/overlapping destinations/u,
		],
		[
			"uppercase hostname",
			(raw) => {
				const apps = (
					raw.environments as Record<string, Record<string, unknown>>
				).production!.applications as Record<string, unknown>[];
				apps[0]!.hostname = "Dashboard.example.com";
			},
			/lowercase DNS hostname/u,
		],
		[
			"invalid disabled behavior",
			(raw) => {
				const apps = (
					raw.environments as Record<string, Record<string, unknown>>
				).production!.applications as Record<string, unknown>[];
				(apps[0]!.boundaries as Record<string, unknown>[])[0]!.whenDisabled =
					"bypass";
			},
			/origin-deny or public/u,
		],
	];
	for (const [name, mutate, expected] of cases) {
		await context.test(name, () => {
			const raw = rawConfig();
			mutate(raw);
			assert.throws(() => parseZeroTrustConfig(raw), expected);
		});
	}
});

test("multiple environments and non-overlapping applications remain independent", async () => {
	const raw = rawConfig(false);
	const environments = raw.environments as Record<string, unknown>;
	const sourceProduction = environments.production as Record<string, unknown>;
	environments.preview = {
		...structuredClone(sourceProduction),
		sourceBranch: "preview",
	};
	const production = environments.production as Record<string, unknown>;
	const applications = production.applications as Record<string, unknown>[];
	applications.push({
		id: "api",
		hostname: "dashboard.example.com",
		boundaries: [
			{
				id: "rpc",
				paths: ["/api", "/api/*"],
				probePath: "/api/health",
				policyIds: ["automation"],
				whenDisabled: "origin-deny",
			},
		],
	});
	const parsed = parseZeroTrustConfig(raw);
	assert.equal(Object.keys(parsed.environments).length, 2);
	assert.equal(parsed.environments.production!.applications.length, 2);
	assert.equal(parsed.environments.preview!.sourceBranch, "preview");
});

test("the repository manifest is strict, disabled, and maps main to production", async () => {
	const manifest = JSON.parse(
		await readFile("tooling/manifests/infrastructure/zero-trust.json", "utf8"),
	) as unknown;
	const parsed = parseZeroTrustConfig(manifest);
	assert.deepEqual(Object.keys(parsed.environments), ["production"]);
	assert.equal(parsed.environments.production!.enabled, false);
	assert.equal(parsed.environments.production!.sourceBranch, "main");
});

test("environment selection is explicit", async () => {
	await assert.rejects(
		planZeroTrust({
			config: config(),
			environmentName: "staging",
			processEnvironment: {},
			access: new FakeAccess(),
		}),
		/Environment staging is not declared/u,
	);
});

test("authentication selection accepts exactly one supported Cloudflare mode", () => {
	assert.deepEqual(
		selectCloudflareAuthentication({ CLOUDFLARE_API_TOKEN: "token" }),
		{
			kind: "api-token",
			token: "token",
		},
	);
	assert.deepEqual(
		selectCloudflareAuthentication({
			CLOUDFLARE_API_KEY: "key",
			CLOUDFLARE_EMAIL: "ops@example.com",
		}),
		{ kind: "global-api-key", key: "key", email: "ops@example.com" },
	);
	assert.throws(
		() => selectCloudflareAuthentication({}),
		/exactly one Cloudflare authentication mode/u,
	);
	assert.throws(
		() =>
			selectCloudflareAuthentication({
				CLOUDFLARE_API_TOKEN: "token",
				CLOUDFLARE_API_KEY: "key",
				CLOUDFLARE_EMAIL: "ops@example.com",
			}),
		/exactly one Cloudflare authentication mode/u,
	);
});

test("account id resolution is exact and environment-driven", () => {
	assert.equal(
		resolveAccountId(
			{ TARGET_ACCOUNT: "71da6f8791d79c8abe7beea6f03d0162" },
			"TARGET_ACCOUNT",
		),
		"71da6f8791d79c8abe7beea6f03d0162",
	);
	assert.throws(
		() => resolveAccountId({}, "TARGET_ACCOUNT"),
		/TARGET_ACCOUNT/u,
	);
});

test("release branch resolution prefers CI and otherwise resolves the local checkout", () => {
	assert.equal(
		resolveCurrentBranch({ GITHUB_REF_NAME: "release-candidate" }),
		"release-candidate",
	);
	assert.equal(resolveCurrentBranch({}, process.cwd()), "main");
	assert.equal(
		resolveCurrentBranch(
			{},
			resolve(tmpdir(), "missing-zero-trust-repository"),
		),
		undefined,
	);
});

test("operator arguments expose only plan and confirmed apply", () => {
	assert.deepEqual(parseArguments(["plan", "--environment", "production"]), {
		action: "plan",
		environment: "production",
		manifestPath: "tooling/manifests/infrastructure/zero-trust.json",
	});
	assert.deepEqual(
		parseArguments([
			"apply",
			"--environment",
			"production",
			"--confirm-project",
			"sample-project",
		]),
		{
			action: "apply",
			environment: "production",
			manifestPath: "tooling/manifests/infrastructure/zero-trust.json",
			confirmProject: "sample-project",
		},
	);
	assert.throws(() => parseArguments(["teardown"]), /plan\|apply/u);
	assert.throws(() => parseArguments(["apply"]), /--environment is required/u);
});

test("apply confirmation and main-to-production mapping fail before provider access", async () => {
	const directory = await mkdtemp(resolve(tmpdir(), "zero-trust-cli-"));
	const manifest = resolve(directory, "manifest.json");
	await writeFile(manifest, `${JSON.stringify(rawConfig(false))}\n`);
	try {
		await assert.rejects(
			runCli(
				["apply", "--environment", "production", "--manifest", manifest],
				{},
			),
			/--confirm-project sample-project/u,
		);
		await assert.rejects(
			runCli(
				[
					"apply",
					"--environment",
					"production",
					"--manifest",
					manifest,
					"--confirm-project",
					"sample-project",
				],
				{ GITHUB_REF_NAME: "feature/not-main" },
			),
			/released only from main/u,
		);
	} finally {
		await rm(directory, { recursive: true, force: true });
	}
});

test("probe verdict matrix covers enabled, disabled fail-closed, and intentionally public routes", () => {
	assert.equal(probeVerdict("access-deny", 302, true).passed, true);
	assert.equal(probeVerdict("access-deny", 401, false).passed, true);
	assert.equal(probeVerdict("access-deny", 200, false).passed, false);
	assert.equal(probeVerdict("origin-deny", 401, false).passed, true);
	assert.equal(probeVerdict("origin-deny", 403, false).passed, true);
	assert.equal(probeVerdict("origin-deny", 302, true).passed, false);
	assert.equal(probeVerdict("origin-deny", 200, false).passed, false);
	assert.equal(probeVerdict("public", 200, false).passed, true);
	assert.equal(probeVerdict("public", 302, true).passed, false);
	assert.equal(probeVerdict("public", 401, false).passed, false);
});

test("deployed probe uses concrete paths and never follows Access redirects", async () => {
	const requested: string[] = [];
	const probes = await probeZeroTrust({
		config: config(false),
		environmentName: "production",
		fetchImplementation: async (request, init) => {
			requested.push(String(request));
			assert.equal(init?.redirect, "manual");
			assert.equal(init?.method, "GET");
			return String(request).endsWith("/health")
				? new Response("ok", { status: 200 })
				: new Response("denied", { status: 401 });
		},
	});
	assert.deepEqual(requested, [
		"https://dashboard.example.com/admin/session",
		"https://dashboard.example.com/health",
	]);
	assert.ok(probes.every((probe) => probe.passed));
});

test("deployed probe supports a POST-only protected boundary", async () => {
	const raw = rawConfig(false);
	const applications = (
		raw.environments as Record<string, Record<string, unknown>>
	).production!.applications as Record<string, unknown>[];
	const boundary = (
		applications[0]!.boundaries as Record<string, unknown>[]
	)[0]!;
	boundary.probeMethod = "POST";
	const probes = await probeZeroTrust({
		config: parseZeroTrustConfig(raw),
		environmentName: "production",
		fetchImplementation: async (request, init) => {
			if (String(request).endsWith("/health")) {
				assert.equal(init?.method, "GET");
				return new Response("ok", { status: 200 });
			}
			assert.equal(init?.method, "POST");
			return new Response("denied", { status: 401 });
		},
	});
	assert.ok(probes.find((probe) => probe.id === "dashboard/admin")?.passed);
});

test("Cloudflare adapter paginates and uses API token auth without leaking it", async () => {
	const requests: Request[] = [];
	const client = new CloudflareAccessClient(
		"71da6f8791d79c8abe7beea6f03d0162",
		{ kind: "api-token", token: "sensitive-token" },
		async (input, init) => {
			const request = new Request(input, init);
			requests.push(request);
			const page = new URL(request.url).searchParams.get("page");
			return Response.json({
				success: true,
				result: [
					{ id: `app-${page}`, name: `app-${page}`, type: "self_hosted" },
				],
				result_info: { page: Number(page), total_pages: 2 },
			});
		},
	);
	const applications = await client.listApplications();
	assert.deepEqual(
		applications.map((application) => application.id),
		["app-1", "app-2"],
	);
	assert.equal(
		requests[0]!.headers.get("authorization"),
		"Bearer sensitive-token",
	);
	assert.equal(requests[0]!.headers.get("x-auth-key"), null);
});

test("Cloudflare adapter supports Global API Key headers and sanitizes provider errors", async () => {
	let captured: Request | undefined;
	const client = new CloudflareAccessClient(
		"71da6f8791d79c8abe7beea6f03d0162",
		{ kind: "global-api-key", key: "sensitive-key", email: "ops@example.com" },
		async (input, init) => {
			captured = new Request(input, init);
			return Response.json(
				{
					success: false,
					result: null,
					errors: [{ code: 9109, message: "sensitive-key" }],
				},
				{ status: 403 },
			);
		},
	);
	await assert.rejects(client.listApplications(), (error: unknown) => {
		assert.ok(error instanceof Error);
		assert.match(error.message, /code 9109/u);
		assert.doesNotMatch(error.message, /sensitive-key/u);
		return true;
	});
	assert.equal(captured!.headers.get("x-auth-key"), "sensitive-key");
	assert.equal(captured!.headers.get("x-auth-email"), "ops@example.com");
});
