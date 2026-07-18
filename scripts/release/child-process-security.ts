const BASE_CHILD_ENVIRONMENT_KEYS = [
	"CI",
	"COMSPEC",
	"COREPACK_HOME",
	"FORCE_COLOR",
	"GITHUB_ACTIONS",
	"GITHUB_WORKSPACE",
	"HOME",
	"LANG",
	"LC_ALL",
	"LOGNAME",
	"NO_COLOR",
	"NPM_CONFIG_USERCONFIG",
	"PATH",
	"PATHEXT",
	"PNPM_HOME",
	"RUNNER_ARCH",
	"RUNNER_OS",
	"SHELL",
	"SYSTEMROOT",
	"TEMP",
	"TERM",
	"TMP",
	"TMPDIR",
	"TZ",
	"USER",
	"XDG_CACHE_HOME",
	"XDG_CONFIG_HOME",
	"XDG_DATA_HOME",
	"npm_config_userconfig",
] as const;

const EXPLICIT_SENSITIVE_KEYS = new Set([
	"CLOUDFLARE_EMAIL",
	"PRODUCTION_UI_PORTAL_ACCESS_AUDIENCE",
	"PRODUCTION_UI_PORTAL_HEALTH_ACCESS_AUDIENCE",
	"UI_PORTAL_ACCESS_CLIENT_ID",
]);
const SENSITIVE_KEY =
	/(?:API_KEY|AUTHORIZATION|CREDENTIAL|PASSWORD|PASSWD|PRIVATE_KEY|SECRET|TOKEN)/iu;

export const CLOUDFLARE_CHILD_ENVIRONMENT_KEYS = [
	"CLOUDFLARE_ACCOUNT_ID",
	"CLOUDFLARE_API_TOKEN",
] as const;

export const PACKAGE_PUBLISH_CHILD_ENVIRONMENT_KEYS = [
	"NODE_AUTH_TOKEN",
] as const;

export function releaseChildEnvironment(
	source: NodeJS.ProcessEnv,
	inheritedKeys: readonly string[] = [],
	overrides: Readonly<Record<string, string>> = {},
): NodeJS.ProcessEnv {
	const environment: NodeJS.ProcessEnv = {};
	for (const key of [...BASE_CHILD_ENVIRONMENT_KEYS, ...inheritedKeys]) {
		const value = source[key];
		if (value !== undefined) environment[key] = value;
	}
	for (const [key, value] of Object.entries(overrides)) {
		environment[key] = value;
	}
	return environment;
}

function sensitiveEnvironmentKey(key: string): boolean {
	return EXPLICIT_SENSITIVE_KEYS.has(key) || SENSITIVE_KEY.test(key);
}

export function sensitiveEnvironmentValues(
	...environments: readonly Readonly<Record<string, string | undefined>>[]
): readonly string[] {
	const values = new Set<string>();
	for (const environment of environments) {
		for (const [key, value] of Object.entries(environment)) {
			if (value && sensitiveEnvironmentKey(key)) values.add(value);
		}
	}
	return [...values].sort((left, right) => right.length - left.length);
}

export function redactSensitiveText(
	text: string,
	values: readonly string[],
): string {
	let redacted = text;
	for (const value of [...new Set(values)].sort(
		(left, right) => right.length - left.length,
	)) {
		if (value) redacted = redacted.split(value).join("[REDACTED]");
	}
	return redacted;
}
