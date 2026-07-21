export type DisabledBoundaryBehavior = "origin-deny" | "public";
export type ProbeMethod = "GET" | "POST";

export interface ZeroTrustConfig {
	readonly version: 1;
	readonly projectId: string;
	readonly environments: Readonly<Record<string, ZeroTrustEnvironment>>;
}

export interface ZeroTrustEnvironment {
	readonly sourceBranch: string;
	readonly enabled: boolean;
	readonly cloudflare: {
		readonly accountIdEnv: string;
		readonly teamDomainEnv: string;
	};
	readonly policies: Readonly<Record<string, ZeroTrustPolicy>>;
	readonly applications: readonly ZeroTrustApplication[];
}

export type ZeroTrustPolicy = HumanPolicy | ServicePolicy;

export interface HumanPolicy {
	readonly type: "human";
	readonly emails?: readonly string[];
	readonly emailsEnv?: string;
	readonly emailDomains?: readonly string[];
	readonly accessGroupIds?: readonly string[];
}

export interface ServicePolicy {
	readonly type: "service";
	readonly serviceTokenIdsEnv: string;
	readonly requireServiceAuth401?: boolean;
}

export interface ZeroTrustApplication {
	readonly id: string;
	readonly enabled?: boolean;
	readonly hostname: string;
	readonly sessionDuration?: string;
	readonly origin?: {
		readonly workerName: string;
		readonly enabledVariable?: string;
		readonly issuerVariable?: string;
	};
	readonly publicProbePaths?: readonly string[];
	readonly boundaries: readonly ZeroTrustBoundary[];
}

export interface ZeroTrustBoundary {
	readonly id: string;
	readonly paths: readonly string[];
	readonly probePath: string;
	readonly probeMethod?: ProbeMethod;
	readonly policyIds: readonly string[];
	readonly audienceVariable?: string;
	readonly whenDisabled: DisabledBoundaryBehavior;
}

export interface AccessApplication {
	readonly id: string;
	readonly name: string;
	readonly type: string;
	readonly domain?: string;
	readonly aud?: string;
	readonly session_duration?: string;
	readonly app_launcher_visible?: boolean;
	readonly service_auth_401_redirect?: boolean;
	readonly destinations?: readonly {
		readonly type?: string;
		readonly uri?: string;
	}[];
}

export interface AccessPolicy {
	readonly id: string;
	readonly name: string;
	readonly decision: string;
	readonly precedence?: number;
	readonly include?: readonly unknown[];
}

export interface AccessApplicationInput {
	readonly name: string;
	readonly type: "self_hosted";
	readonly domain: string;
	readonly destinations: readonly {
		readonly type: "public";
		readonly uri: string;
	}[];
	readonly session_duration: string;
	readonly app_launcher_visible: false;
	readonly service_auth_401_redirect: boolean;
}

export interface AccessPolicyInput {
	readonly name: string;
	readonly decision: "allow" | "non_identity";
	readonly precedence: number;
	readonly include: readonly unknown[];
}

export interface CloudflareAccessPort {
	listApplications(): Promise<readonly AccessApplication[]>;
	createApplication(input: AccessApplicationInput): Promise<AccessApplication>;
	updateApplication(
		applicationId: string,
		input: AccessApplicationInput,
	): Promise<AccessApplication>;
	deleteApplication(applicationId: string): Promise<void>;
	listPolicies(applicationId: string): Promise<readonly AccessPolicy[]>;
	createPolicy(
		applicationId: string,
		input: AccessPolicyInput,
	): Promise<AccessPolicy>;
	updatePolicy(
		applicationId: string,
		policyId: string,
		input: AccessPolicyInput,
	): Promise<AccessPolicy>;
	deletePolicy(applicationId: string, policyId: string): Promise<void>;
}

export type ReconcileAction =
	| {
			readonly kind: "create-application";
			readonly application: string;
			readonly domain: string;
	  }
	| {
			readonly kind: "update-application";
			readonly application: string;
			readonly domain: string;
	  }
	| {
			readonly kind: "delete-application";
			readonly application: string;
			readonly domain: string;
	  }
	| {
			readonly kind: "create-policy";
			readonly application: string;
			readonly policy: string;
	  }
	| {
			readonly kind: "update-policy";
			readonly application: string;
			readonly policy: string;
	  }
	| {
			readonly kind: "delete-policy";
			readonly application: string;
			readonly policy: string;
	  };

export interface OriginProjection {
	readonly workerName: string;
	readonly variables: Readonly<Record<string, string>>;
}

export interface ReconcilePlan {
	readonly projectId: string;
	readonly environment: string;
	readonly sourceBranch: string;
	readonly enabled: boolean;
	readonly actions: readonly ReconcileAction[];
	readonly originProjection: readonly OriginProjection[];
}

export interface ProbeResult {
	readonly id: string;
	readonly url: string;
	readonly expected: "access-deny" | "origin-deny" | "public";
	readonly status: number;
	readonly passed: boolean;
	readonly reason: string;
}

interface DesiredApplication {
	readonly name: string;
	readonly input: AccessApplicationInput;
	readonly policyInputs: readonly AccessPolicyInput[];
	readonly application: ZeroTrustApplication;
	readonly boundary: ZeroTrustBoundary;
}

const identifierPattern = /^[a-z][a-z0-9-]{1,62}$/u;
const environmentVariablePattern = /^[A-Z][A-Z0-9_]*$/u;
const hostnamePattern =
	/^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/u;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/u;
const uuidPattern =
	/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;
const sessionDurationPattern = /^\d+(?:ms|s|m|h)$/u;

export function parseZeroTrustConfig(value: unknown): ZeroTrustConfig {
	const root = record(value, "configuration");
	strictKeys(root, ["version", "projectId", "environments"], "configuration");
	if (root.version !== 1) fail("configuration.version must be 1.");
	const projectId = identifier(root.projectId, "configuration.projectId");
	const environmentValues = record(
		root.environments,
		"configuration.environments",
	);
	if (Object.keys(environmentValues).length === 0) {
		fail("configuration.environments must contain at least one environment.");
	}
	const environments: Record<string, ZeroTrustEnvironment> = {};
	for (const [environmentName, rawEnvironment] of Object.entries(
		environmentValues,
	)) {
		identifier(environmentName, `environment name ${environmentName}`);
		environments[environmentName] = parseEnvironment(
			rawEnvironment,
			`configuration.environments.${environmentName}`,
		);
	}
	return { version: 1, projectId, environments };
}

export function validateEnvironmentSelection(
	config: ZeroTrustConfig,
	environmentName: string,
): ZeroTrustEnvironment {
	const environment = config.environments[environmentName];
	if (!environment) {
		fail(
			`Environment ${environmentName} is not declared by project ${config.projectId}.`,
		);
	}
	return environment;
}

export function managedApplicationPrefix(
	projectId: string,
	environmentName: string,
): string {
	return `lemn-zt:${projectId}:${environmentName}:`;
}

export async function planZeroTrust(input: {
	readonly config: ZeroTrustConfig;
	readonly environmentName: string;
	readonly processEnvironment: NodeJS.ProcessEnv;
	readonly access: CloudflareAccessPort;
}): Promise<ReconcilePlan> {
	const environment = validateEnvironmentSelection(
		input.config,
		input.environmentName,
	);
	const desired = desiredApplications(
		input.config.projectId,
		input.environmentName,
		environment,
		input.processEnvironment,
	);
	const remote = await input.access.listApplications();
	const byName = uniqueApplications(remote);
	assertNoDestinationConflicts(
		remote,
		desired,
		input.config.projectId,
		input.environmentName,
	);
	const actions: ReconcileAction[] = [];
	const prefix = managedApplicationPrefix(
		input.config.projectId,
		input.environmentName,
	);
	const desiredNames = new Set(desired.map((entry) => entry.name));

	for (const remoteApplication of remote) {
		if (
			remoteApplication.name.startsWith(prefix) &&
			!desiredNames.has(remoteApplication.name)
		) {
			actions.push({
				kind: "delete-application",
				application: remoteApplication.name,
				domain: remoteApplication.domain ?? "unknown",
			});
		}
	}

	for (const desiredApplication of desired) {
		const remoteApplication = byName.get(desiredApplication.name);
		if (!remoteApplication) {
			actions.push({
				kind: "create-application",
				application: desiredApplication.name,
				domain: desiredApplication.input.domain,
			});
			for (const policy of desiredApplication.policyInputs) {
				actions.push({
					kind: "create-policy",
					application: desiredApplication.name,
					policy: policy.name,
				});
			}
			continue;
		}
		if (!applicationMatches(remoteApplication, desiredApplication.input)) {
			actions.push({
				kind: "update-application",
				application: desiredApplication.name,
				domain: desiredApplication.input.domain,
			});
		}
		const policies = await input.access.listPolicies(remoteApplication.id);
		assertPoliciesOwned(desiredApplication.name, policies);
		const desiredPolicies = new Map(
			desiredApplication.policyInputs.map((policy) => [policy.name, policy]),
		);
		const remotePolicies = new Map(
			policies.map((policy) => [policy.name, policy]),
		);
		for (const policy of policies) {
			if (!desiredPolicies.has(policy.name)) {
				actions.push({
					kind: "delete-policy",
					application: desiredApplication.name,
					policy: policy.name,
				});
			}
		}
		for (const policy of desiredApplication.policyInputs) {
			const remotePolicy = remotePolicies.get(policy.name);
			if (!remotePolicy) {
				actions.push({
					kind: "create-policy",
					application: desiredApplication.name,
					policy: policy.name,
				});
			} else if (!policyMatches(remotePolicy, policy)) {
				actions.push({
					kind: "update-policy",
					application: desiredApplication.name,
					policy: policy.name,
				});
			}
		}
	}

	return {
		projectId: input.config.projectId,
		environment: input.environmentName,
		sourceBranch: environment.sourceBranch,
		enabled: environment.enabled,
		actions,
		originProjection: projectOriginVariables(environment, desired, byName),
	};
}

export async function applyZeroTrust(input: {
	readonly config: ZeroTrustConfig;
	readonly environmentName: string;
	readonly processEnvironment: NodeJS.ProcessEnv;
	readonly access: CloudflareAccessPort;
}): Promise<{
	readonly applied: ReconcilePlan;
	readonly converged: ReconcilePlan;
}> {
	const applied = await planZeroTrust(input);
	const environment = validateEnvironmentSelection(
		input.config,
		input.environmentName,
	);
	const desired = desiredApplications(
		input.config.projectId,
		input.environmentName,
		environment,
		input.processEnvironment,
	);
	const desiredNames = new Set(desired.map((entry) => entry.name));
	const prefix = managedApplicationPrefix(
		input.config.projectId,
		input.environmentName,
	);

	for (const remoteApplication of await input.access.listApplications()) {
		if (
			remoteApplication.name.startsWith(prefix) &&
			!desiredNames.has(remoteApplication.name)
		) {
			await input.access.deleteApplication(remoteApplication.id);
		}
	}

	for (const desiredApplication of desired) {
		let remoteApplication = (await input.access.listApplications()).find(
			(candidate) => candidate.name === desiredApplication.name,
		);
		if (!remoteApplication) {
			remoteApplication = await input.access.createApplication(
				desiredApplication.input,
			);
		} else if (
			!applicationMatches(remoteApplication, desiredApplication.input)
		) {
			remoteApplication = await input.access.updateApplication(
				remoteApplication.id,
				desiredApplication.input,
			);
		}
		const policies = await input.access.listPolicies(remoteApplication.id);
		assertPoliciesOwned(desiredApplication.name, policies);
		const desiredPolicies = new Map(
			desiredApplication.policyInputs.map((policy) => [policy.name, policy]),
		);
		for (const policy of policies) {
			if (!desiredPolicies.has(policy.name)) {
				await input.access.deletePolicy(remoteApplication.id, policy.id);
			}
		}
		const currentPolicies = new Map(
			(await input.access.listPolicies(remoteApplication.id)).map((policy) => [
				policy.name,
				policy,
			]),
		);
		for (const policy of desiredApplication.policyInputs) {
			const current = currentPolicies.get(policy.name);
			if (!current) {
				await input.access.createPolicy(remoteApplication.id, policy);
			} else if (!policyMatches(current, policy)) {
				await input.access.updatePolicy(
					remoteApplication.id,
					current.id,
					policy,
				);
			}
		}
	}

	const converged = await planZeroTrust(input);
	if (converged.actions.length > 0) {
		fail(
			"Cloudflare Access did not converge after apply; no success is claimed.",
		);
	}
	return { applied, converged };
}

export async function probeZeroTrust(input: {
	readonly config: ZeroTrustConfig;
	readonly environmentName: string;
	readonly fetchImplementation?: typeof fetch;
}): Promise<readonly ProbeResult[]> {
	const environment = validateEnvironmentSelection(
		input.config,
		input.environmentName,
	);
	const fetchImplementation = input.fetchImplementation ?? fetch;
	const results: ProbeResult[] = [];
	for (const application of environment.applications) {
		if (application.enabled === false) continue;
		for (const boundary of application.boundaries) {
			const expected = environment.enabled
				? "access-deny"
				: boundary.whenDisabled;
			const url = `https://${application.hostname}${boundary.probePath}`;
			const response = await fetchImplementation(url, {
				method: boundary.probeMethod ?? "GET",
				redirect: "manual",
				headers: { "user-agent": "lemn-zero-trust-reconciler/1" },
			});
			const location = response.headers.get("location") ?? "";
			const redirectsToAccess = /\.cloudflareaccess\.com(?:\/|$)/iu.test(
				location,
			);
			const verdict = probeVerdict(
				expected,
				response.status,
				redirectsToAccess,
			);
			results.push({
				id: `${application.id}/${boundary.id}`,
				url,
				expected,
				status: response.status,
				passed: verdict.passed,
				reason: verdict.reason,
			});
		}
		for (const path of application.publicProbePaths ?? []) {
			const url = `https://${application.hostname}${path}`;
			const response = await fetchImplementation(url, {
				method: "GET",
				redirect: "manual",
				headers: { "user-agent": "lemn-zero-trust-reconciler/1" },
			});
			const location = response.headers.get("location") ?? "";
			const redirectsToAccess = /\.cloudflareaccess\.com(?:\/|$)/iu.test(
				location,
			);
			const verdict = probeVerdict(
				"public",
				response.status,
				redirectsToAccess,
			);
			results.push({
				id: `${application.id}/public:${path}`,
				url,
				expected: "public",
				status: response.status,
				passed: verdict.passed,
				reason: verdict.reason,
			});
		}
	}
	return results;
}

export function probeVerdict(
	expected: ProbeResult["expected"],
	status: number,
	redirectsToAccess: boolean,
): { readonly passed: boolean; readonly reason: string } {
	if (expected === "public") {
		return status >= 200 && status < 400 && !redirectsToAccess
			? {
					passed: true,
					reason: "The public route is reachable without Access.",
				}
			: {
					passed: false,
					reason: "The public route was denied or redirected to Access.",
				};
	}
	if (expected === "origin-deny") {
		return (status === 401 || status === 403) && !redirectsToAccess
			? {
					passed: true,
					reason: "Edge Access is absent and the origin denied anonymously.",
				}
			: {
					passed: false,
					reason: "Expected an origin 401/403 without an Access redirect.",
				};
	}
	return redirectsToAccess || status === 401 || status === 403
		? {
				passed: true,
				reason: "Anonymous traffic was denied by the enabled boundary.",
			}
		: { passed: false, reason: "Enabled Access allowed anonymous traffic." };
}

function parseEnvironment(value: unknown, path: string): ZeroTrustEnvironment {
	const environment = record(value, path);
	strictKeys(
		environment,
		["sourceBranch", "enabled", "cloudflare", "policies", "applications"],
		path,
	);
	const sourceBranch = nonEmptyString(
		environment.sourceBranch,
		`${path}.sourceBranch`,
	);
	const enabled = boolean(environment.enabled, `${path}.enabled`);
	const cloudflareValue = record(environment.cloudflare, `${path}.cloudflare`);
	strictKeys(
		cloudflareValue,
		["accountIdEnv", "teamDomainEnv"],
		`${path}.cloudflare`,
	);
	const cloudflare = {
		accountIdEnv: environmentVariable(
			cloudflareValue.accountIdEnv,
			`${path}.cloudflare.accountIdEnv`,
		),
		teamDomainEnv: environmentVariable(
			cloudflareValue.teamDomainEnv,
			`${path}.cloudflare.teamDomainEnv`,
		),
	};
	const policiesValue = record(environment.policies, `${path}.policies`);
	const policies: Record<string, ZeroTrustPolicy> = {};
	for (const [policyId, rawPolicy] of Object.entries(policiesValue)) {
		identifier(policyId, `${path}.policies key ${policyId}`);
		policies[policyId] = parsePolicy(rawPolicy, `${path}.policies.${policyId}`);
	}
	if (
		!Array.isArray(environment.applications) ||
		environment.applications.length === 0
	) {
		fail(`${path}.applications must contain at least one application.`);
	}
	const applications = environment.applications.map((application, index) =>
		parseApplication(application, `${path}.applications[${index}]`, policies),
	);
	uniqueBy(
		applications,
		(application) => application.id,
		`${path}.applications ids`,
	);
	assertNoBoundaryOverlap(applications, path);
	return { sourceBranch, enabled, cloudflare, policies, applications };
}

function parsePolicy(value: unknown, path: string): ZeroTrustPolicy {
	const policy = record(value, path);
	if (policy.type === "human") {
		strictKeys(
			policy,
			["type", "emails", "emailsEnv", "emailDomains", "accessGroupIds"],
			path,
		);
		const emails = optionalStrings(policy.emails, `${path}.emails`).map(
			(email) => {
				if (!emailPattern.test(email))
					fail(`${path}.emails contains an invalid email.`);
				return email.toLowerCase();
			},
		);
		const emailsEnv = optionalEnvironmentVariable(
			policy.emailsEnv,
			`${path}.emailsEnv`,
		);
		const emailDomains = optionalStrings(
			policy.emailDomains,
			`${path}.emailDomains`,
		).map((domain) => {
			const normalized = domain.toLowerCase();
			if (!hostnamePattern.test(`x.${normalized}`)) {
				fail(`${path}.emailDomains contains an invalid domain.`);
			}
			return normalized;
		});
		const accessGroupIds = optionalStrings(
			policy.accessGroupIds,
			`${path}.accessGroupIds`,
		).map((id) => {
			if (!uuidPattern.test(id))
				fail(`${path}.accessGroupIds must contain UUIDs.`);
			return id;
		});
		if (
			emails.length === 0 &&
			!emailsEnv &&
			emailDomains.length === 0 &&
			accessGroupIds.length === 0
		) {
			fail(`${path} must declare at least one exact human selector.`);
		}
		return {
			type: "human",
			...(emails.length > 0 ? { emails } : {}),
			...(emailsEnv ? { emailsEnv } : {}),
			...(emailDomains.length > 0 ? { emailDomains } : {}),
			...(accessGroupIds.length > 0 ? { accessGroupIds } : {}),
		};
	}
	if (policy.type === "service") {
		strictKeys(
			policy,
			["type", "serviceTokenIdsEnv", "requireServiceAuth401"],
			path,
		);
		return {
			type: "service",
			serviceTokenIdsEnv: environmentVariable(
				policy.serviceTokenIdsEnv,
				`${path}.serviceTokenIdsEnv`,
			),
			...(policy.requireServiceAuth401 === undefined
				? {}
				: {
						requireServiceAuth401: boolean(
							policy.requireServiceAuth401,
							`${path}.requireServiceAuth401`,
						),
					}),
		};
	}
	fail(`${path}.type must be human or service; bypass is not supported.`);
}

function parseApplication(
	value: unknown,
	path: string,
	policies: Readonly<Record<string, ZeroTrustPolicy>>,
): ZeroTrustApplication {
	const application = record(value, path);
	strictKeys(
		application,
		[
			"id",
			"enabled",
			"hostname",
			"sessionDuration",
			"origin",
			"publicProbePaths",
			"boundaries",
		],
		path,
	);
	const id = identifier(application.id, `${path}.id`);
	const hostname = nonEmptyString(application.hostname, `${path}.hostname`);
	if (hostname !== hostname.toLowerCase() || !hostnamePattern.test(hostname)) {
		fail(`${path}.hostname must be a lowercase DNS hostname.`);
	}
	const enabled =
		application.enabled === undefined
			? undefined
			: boolean(application.enabled, `${path}.enabled`);
	const sessionDuration =
		application.sessionDuration === undefined
			? undefined
			: nonEmptyString(application.sessionDuration, `${path}.sessionDuration`);
	if (sessionDuration && !sessionDurationPattern.test(sessionDuration)) {
		fail(
			`${path}.sessionDuration must use one duration unit such as 30m or 24h.`,
		);
	}
	const origin =
		application.origin === undefined
			? undefined
			: parseOrigin(application.origin, `${path}.origin`);
	const publicProbePaths = optionalStrings(
		application.publicProbePaths,
		`${path}.publicProbePaths`,
	).map((probePath) => exactPath(probePath, `${path}.publicProbePaths`));
	if (
		!Array.isArray(application.boundaries) ||
		application.boundaries.length === 0
	) {
		fail(`${path}.boundaries must contain at least one boundary.`);
	}
	const boundaries = application.boundaries.map((boundary, index) =>
		parseBoundary(boundary, `${path}.boundaries[${index}]`, policies),
	);
	uniqueBy(boundaries, (boundary) => boundary.id, `${path}.boundaries ids`);
	return {
		id,
		...(enabled === undefined ? {} : { enabled }),
		hostname,
		...(sessionDuration ? { sessionDuration } : {}),
		...(origin ? { origin } : {}),
		...(publicProbePaths.length > 0 ? { publicProbePaths } : {}),
		boundaries,
	};
}

function parseOrigin(
	value: unknown,
	path: string,
): NonNullable<ZeroTrustApplication["origin"]> {
	const origin = record(value, path);
	strictKeys(origin, ["workerName", "enabledVariable", "issuerVariable"], path);
	return {
		workerName: nonEmptyString(origin.workerName, `${path}.workerName`),
		...(origin.enabledVariable === undefined
			? {}
			: {
					enabledVariable: environmentVariable(
						origin.enabledVariable,
						`${path}.enabledVariable`,
					),
				}),
		...(origin.issuerVariable === undefined
			? {}
			: {
					issuerVariable: environmentVariable(
						origin.issuerVariable,
						`${path}.issuerVariable`,
					),
				}),
	};
}

function parseBoundary(
	value: unknown,
	path: string,
	policies: Readonly<Record<string, ZeroTrustPolicy>>,
): ZeroTrustBoundary {
	const boundary = record(value, path);
	strictKeys(
		boundary,
		[
			"id",
			"paths",
			"probePath",
			"probeMethod",
			"policyIds",
			"audienceVariable",
			"whenDisabled",
		],
		path,
	);
	const id = identifier(boundary.id, `${path}.id`);
	if (!Array.isArray(boundary.paths) || boundary.paths.length === 0) {
		fail(`${path}.paths must contain at least one path.`);
	}
	const paths = boundary.paths.map((candidate, index) =>
		accessPath(candidate, `${path}.paths[${index}]`),
	);
	uniqueStrings(paths, `${path}.paths`);
	const probePath = exactPath(boundary.probePath, `${path}.probePath`);
	const probeMethod =
		boundary.probeMethod === undefined
			? undefined
			: probeHttpMethod(boundary.probeMethod, `${path}.probeMethod`);
	if (!paths.some((candidate) => pathCovers(candidate, probePath))) {
		fail(`${path}.probePath must be covered by one declared path.`);
	}
	if (!Array.isArray(boundary.policyIds) || boundary.policyIds.length === 0) {
		fail(`${path}.policyIds must contain at least one policy id.`);
	}
	const policyIds = boundary.policyIds.map((policyId, index) => {
		const idValue = identifier(policyId, `${path}.policyIds[${index}]`);
		if (!policies[idValue])
			fail(`${path}.policyIds references unknown policy ${idValue}.`);
		return idValue;
	});
	uniqueStrings(policyIds, `${path}.policyIds`);
	if (
		boundary.whenDisabled !== "origin-deny" &&
		boundary.whenDisabled !== "public"
	) {
		fail(`${path}.whenDisabled must be origin-deny or public.`);
	}
	return {
		id,
		paths,
		probePath,
		...(probeMethod ? { probeMethod } : {}),
		policyIds,
		...(boundary.audienceVariable === undefined
			? {}
			: {
					audienceVariable: environmentVariable(
						boundary.audienceVariable,
						`${path}.audienceVariable`,
					),
				}),
		whenDisabled: boundary.whenDisabled,
	};
}

function desiredApplications(
	projectId: string,
	environmentName: string,
	environment: ZeroTrustEnvironment,
	processEnvironment: NodeJS.ProcessEnv,
): readonly DesiredApplication[] {
	if (!environment.enabled) return [];
	const desired: DesiredApplication[] = [];
	for (const application of environment.applications) {
		if (application.enabled === false) continue;
		for (const boundary of application.boundaries) {
			const name = `${managedApplicationPrefix(projectId, environmentName)}${application.id}:${boundary.id}`;
			const destinations = boundary.paths.map((path) => ({
				type: "public" as const,
				uri: destination(application.hostname, path),
			}));
			const policyInputs = boundary.policyIds.map((policyId, index) => {
				const policy = environment.policies[policyId];
				if (!policy)
					fail(
						`Boundary ${boundary.id} references missing policy ${policyId}.`,
					);
				return policyInput(
					name,
					policyId,
					policy,
					index + 1,
					processEnvironment,
				);
			});
			const primaryDestination = destinations[0];
			if (!primaryDestination)
				fail(`Boundary ${boundary.id} resolved to no destinations.`);
			desired.push({
				name,
				input: {
					name,
					type: "self_hosted",
					domain: primaryDestination.uri,
					destinations,
					session_duration: application.sessionDuration ?? "24h",
					app_launcher_visible: false,
					service_auth_401_redirect: policyInputs.some(
						(policy) => policy.decision === "non_identity",
					),
				},
				policyInputs,
				application,
				boundary,
			});
		}
	}
	return desired;
}

function policyInput(
	applicationName: string,
	policyId: string,
	policy: ZeroTrustPolicy,
	precedence: number,
	processEnvironment: NodeJS.ProcessEnv,
): AccessPolicyInput {
	const name = `${applicationName}:policy:${policyId}`;
	if (policy.type === "service") {
		const ids = environmentList(processEnvironment, policy.serviceTokenIdsEnv);
		if (ids.length === 0 || ids.some((id) => !uuidPattern.test(id))) {
			fail(
				`${policy.serviceTokenIdsEnv} must contain one or more Cloudflare service-token UUIDs.`,
			);
		}
		return {
			name,
			decision: "non_identity",
			precedence,
			include: ids.map((id) => ({ service_token: { token_id: id } })),
		};
	}
	const emails = [
		...(policy.emails ?? []),
		...(policy.emailsEnv
			? environmentList(processEnvironment, policy.emailsEnv)
			: []),
	].map((email) => email.toLowerCase());
	if (emails.some((email) => !emailPattern.test(email))) {
		fail(`${policy.emailsEnv ?? name} contains an invalid email selector.`);
	}
	const include = [
		...emails.map((email) => ({ email: { email } })),
		...(policy.emailDomains ?? []).map((domain) => ({
			email_domain: { domain },
		})),
		...(policy.accessGroupIds ?? []).map((id) => ({ group: { id } })),
	];
	if (include.length === 0) fail(`${name} resolved to no human selectors.`);
	return { name, decision: "allow", precedence, include };
}

function projectOriginVariables(
	environment: ZeroTrustEnvironment,
	desired: readonly DesiredApplication[],
	remoteByName: ReadonlyMap<string, AccessApplication>,
): readonly OriginProjection[] {
	const workers = new Map<string, Record<string, string[]>>();
	for (const application of environment.applications) {
		if (!application.origin) continue;
		const values = workers.get(application.origin.workerName) ?? {};
		if (application.origin.enabledVariable) {
			values[application.origin.enabledVariable] = [
				environment.enabled && application.enabled !== false ? "true" : "false",
			];
		}
		if (application.origin.issuerVariable) {
			values[application.origin.issuerVariable] = environment.enabled
				? [`env:${environment.cloudflare.teamDomainEnv}`]
				: [""];
		}
		workers.set(application.origin.workerName, values);
	}
	for (const entry of desired) {
		if (!entry.application.origin || !entry.boundary.audienceVariable) continue;
		const values = workers.get(entry.application.origin.workerName) ?? {};
		const current = values[entry.boundary.audienceVariable] ?? [];
		const audience = remoteByName.get(entry.name)?.aud ?? "<pending>";
		values[entry.boundary.audienceVariable] = [...current, audience];
		workers.set(entry.application.origin.workerName, values);
	}
	for (const application of environment.applications) {
		if (!application.origin || environment.enabled) continue;
		const values = workers.get(application.origin.workerName) ?? {};
		for (const boundary of application.boundaries) {
			if (boundary.audienceVariable) values[boundary.audienceVariable] = [""];
		}
		workers.set(application.origin.workerName, values);
	}
	return [...workers.entries()]
		.sort(([left], [right]) => left.localeCompare(right))
		.map(([workerName, values]) => ({
			workerName,
			variables: Object.fromEntries(
				Object.entries(values)
					.sort(([left], [right]) => left.localeCompare(right))
					.map(([name, entries]) => [
						name,
						[...new Set(entries)].sort().join(","),
					]),
			),
		}));
}

function applicationMatches(
	remote: AccessApplication,
	desired: AccessApplicationInput,
): boolean {
	return (
		remote.name === desired.name &&
		remote.type === desired.type &&
		remote.domain === desired.domain &&
		remote.session_duration === desired.session_duration &&
		remote.app_launcher_visible === desired.app_launcher_visible &&
		remote.service_auth_401_redirect === desired.service_auth_401_redirect &&
		canonical(
			(remote.destinations ?? []).map((entry) => ({
				type: entry.type,
				uri: entry.uri,
			})),
		) === canonical(desired.destinations)
	);
}

function policyMatches(
	remote: AccessPolicy,
	desired: AccessPolicyInput,
): boolean {
	return (
		remote.name === desired.name &&
		remote.decision === desired.decision &&
		remote.precedence === desired.precedence &&
		canonical(remote.include ?? []) === canonical(desired.include)
	);
}

function uniqueApplications(
	applications: readonly AccessApplication[],
): ReadonlyMap<string, AccessApplication> {
	const result = new Map<string, AccessApplication>();
	for (const application of applications) {
		if (result.has(application.name)) {
			fail(
				`Cloudflare returned duplicate Access application name ${application.name}.`,
			);
		}
		result.set(application.name, application);
	}
	return result;
}

function assertPoliciesOwned(
	applicationName: string,
	policies: readonly AccessPolicy[],
): void {
	const prefix = `${applicationName}:policy:`;
	const names = new Set<string>();
	for (const policy of policies) {
		if (!policy.name.startsWith(prefix)) {
			fail(
				`Managed application ${applicationName} contains foreign policy ${policy.name}; refusing mutation.`,
			);
		}
		if (names.has(policy.name))
			fail(
				`Managed application ${applicationName} has duplicate policy ${policy.name}.`,
			);
		names.add(policy.name);
	}
}

function assertNoDestinationConflicts(
	remote: readonly AccessApplication[],
	desired: readonly DesiredApplication[],
	projectId: string,
	environmentName: string,
): void {
	const prefix = managedApplicationPrefix(projectId, environmentName);
	for (const desiredApplication of desired) {
		const desiredUris = desiredApplication.input.destinations.map(
			(entry) => entry.uri,
		);
		for (const remoteApplication of remote) {
			if (
				remoteApplication.name === desiredApplication.name ||
				remoteApplication.name.startsWith(prefix)
			)
				continue;
			const remoteUris = [
				...(remoteApplication.destinations ?? []).flatMap((entry) =>
					entry.uri ? [entry.uri] : [],
				),
				...(remoteApplication.domain ? [remoteApplication.domain] : []),
			];
			if (
				desiredUris.some((desiredUri) =>
					remoteUris.some((remoteUri) =>
						destinationsOverlap(desiredUri, remoteUri),
					),
				)
			) {
				fail(
					`Destination ${desiredApplication.input.domain} is already owned by foreign Access application ${remoteApplication.name}.`,
				);
			}
		}
	}
}

function assertNoBoundaryOverlap(
	applications: readonly ZeroTrustApplication[],
	path: string,
): void {
	const seen: {
		readonly hostname: string;
		readonly label: string;
		readonly paths: readonly string[];
	}[] = [];
	for (const application of applications) {
		for (const boundary of application.boundaries) {
			const label = `${application.id}/${boundary.id}`;
			for (const previous of seen) {
				if (
					previous.hostname === application.hostname &&
					previous.paths.some((left) =>
						boundary.paths.some((right) => accessPathsOverlap(left, right)),
					)
				) {
					fail(
						`${path} has overlapping destinations on ${application.hostname} in ${previous.label} and ${label}.`,
					);
				}
			}
			seen.push({
				hostname: application.hostname,
				label,
				paths: boundary.paths,
			});
		}
	}
}

function destinationsOverlap(left: string, right: string): boolean {
	const leftDestination = splitDestination(left);
	const rightDestination = splitDestination(right);
	return (
		leftDestination.hostname === rightDestination.hostname &&
		accessPathsOverlap(leftDestination.path, rightDestination.path)
	);
}

function splitDestination(value: string): {
	readonly hostname: string;
	readonly path: string;
} {
	const normalized = value.replace(/^https?:\/\//iu, "");
	const separator = normalized.indexOf("/");
	if (separator === -1)
		return { hostname: normalized.toLowerCase(), path: "/*" };
	return {
		hostname: normalized.slice(0, separator).toLowerCase(),
		path: normalized.slice(separator) || "/*",
	};
}

function accessPathsOverlap(left: string, right: string): boolean {
	if (left === "/" || left === "/*" || right === "/" || right === "/*")
		return true;
	if (left === right) return true;
	const leftWildcard = left.endsWith("*");
	const rightWildcard = right.endsWith("*");
	const leftPrefix = leftWildcard ? left.slice(0, -1) : left;
	const rightPrefix = rightWildcard ? right.slice(0, -1) : right;
	if (leftWildcard && rightWildcard) {
		return (
			leftPrefix.startsWith(rightPrefix) || rightPrefix.startsWith(leftPrefix)
		);
	}
	if (leftWildcard) return right.startsWith(leftPrefix);
	if (rightWildcard) return left.startsWith(rightPrefix);
	return false;
}

function destination(hostname: string, path: string): string {
	return path === "/" || path === "/*" ? hostname : `${hostname}${path}`;
}

function pathCovers(pattern: string, candidate: string): boolean {
	if (pattern === "/" || pattern === "/*") return true;
	if (pattern.endsWith("*")) return candidate.startsWith(pattern.slice(0, -1));
	return pattern === candidate;
}

function accessPath(value: unknown, path: string): string {
	const candidate = nonEmptyString(value, path);
	if (
		!candidate.startsWith("/") ||
		candidate.includes("?") ||
		candidate.includes("#") ||
		candidate.includes("\\") ||
		(candidate.includes("*") && !candidate.endsWith("*")) ||
		(candidate.match(/\*/gu)?.length ?? 0) > 1
	) {
		fail(
			`${path} must be an absolute path with at most one trailing wildcard.`,
		);
	}
	return candidate;
}

function exactPath(value: unknown, path: string): string {
	const candidate = accessPath(value, path);
	if (candidate.includes("*"))
		fail(`${path} must be concrete and cannot contain a wildcard.`);
	return candidate;
}

function environmentList(
	environment: NodeJS.ProcessEnv,
	name: string,
): readonly string[] {
	return [
		...new Set(
			(environment[name] ?? "")
				.split(",")
				.map((value) => value.trim())
				.filter(Boolean),
		),
	].sort();
}

function record(value: unknown, path: string): Record<string, unknown> {
	if (!value || typeof value !== "object" || Array.isArray(value)) {
		fail(`${path} must be an object.`);
	}
	return value as Record<string, unknown>;
}

function strictKeys(
	value: Readonly<Record<string, unknown>>,
	allowed: readonly string[],
	path: string,
): void {
	const unexpected = Object.keys(value).filter((key) => !allowed.includes(key));
	if (unexpected.length > 0)
		fail(`${path} contains unsupported keys: ${unexpected.sort().join(", ")}.`);
}

function identifier(value: unknown, path: string): string {
	const candidate = nonEmptyString(value, path);
	if (!identifierPattern.test(candidate))
		fail(`${path} must be a lowercase kebab-case identifier.`);
	return candidate;
}

function environmentVariable(value: unknown, path: string): string {
	const candidate = nonEmptyString(value, path);
	if (!environmentVariablePattern.test(candidate))
		fail(`${path} must be an uppercase environment-variable name.`);
	return candidate;
}

function optionalEnvironmentVariable(
	value: unknown,
	path: string,
): string | undefined {
	return value === undefined ? undefined : environmentVariable(value, path);
}

function nonEmptyString(value: unknown, path: string): string {
	if (
		typeof value !== "string" ||
		value.length === 0 ||
		value.trim() !== value
	) {
		fail(`${path} must be a non-empty trimmed string.`);
	}
	return value;
}

function optionalStrings(value: unknown, path: string): string[] {
	if (value === undefined) return [];
	if (!Array.isArray(value)) fail(`${path} must be an array of strings.`);
	const result = value.map((entry, index) =>
		nonEmptyString(entry, `${path}[${index}]`),
	);
	uniqueStrings(result, path);
	return result;
}

function boolean(value: unknown, path: string): boolean {
	if (typeof value !== "boolean") fail(`${path} must be a boolean.`);
	return value;
}

function probeHttpMethod(value: unknown, path: string): ProbeMethod {
	if (value !== "GET" && value !== "POST") {
		fail(`${path} must be GET or POST.`);
	}
	return value;
}

function uniqueStrings(values: readonly string[], path: string): void {
	if (new Set(values).size !== values.length)
		fail(`${path} must not contain duplicates.`);
}

function uniqueBy<T>(
	values: readonly T[],
	key: (value: T) => string,
	path: string,
): void {
	const keys = values.map(key);
	if (new Set(keys).size !== keys.length) fail(`${path} must be unique.`);
}

function canonical(value: unknown): string {
	return JSON.stringify(sortValue(value));
}

function sortValue(value: unknown): unknown {
	if (Array.isArray(value)) {
		return value
			.map(sortValue)
			.sort((left, right) =>
				JSON.stringify(left).localeCompare(JSON.stringify(right)),
			);
	}
	if (value && typeof value === "object") {
		return Object.fromEntries(
			Object.entries(value as Record<string, unknown>)
				.sort(([left], [right]) => left.localeCompare(right))
				.map(([key, entry]) => [key, sortValue(entry)]),
		);
	}
	return value;
}

function fail(message: string): never {
	throw new Error(message);
}
