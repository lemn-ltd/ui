import { uiPortalAppDescriptor } from "../app-descriptor";
import type { UiPortalEnv } from "./env";

export interface UiPortalServiceDescriptor {
	readonly name: "ui-portal";
	readonly displayName: "Lemn UI";
	readonly description: string;
	readonly ownerPackage: "@lemn-ltd/ui-portal";
	readonly workerName: "lemn-ui-portal";
	readonly publicOrigin: "https://portal.ui.le-mn.com";
	readonly schemaOrigin: "https://schemas.ui.le-mn.com";
}

export interface UiPortalValidationResult {
	readonly ready: boolean;
	readonly missingBindings: readonly string[];
	readonly missingConfiguration: readonly string[];
}

export const uiPortalServiceDescriptor: UiPortalServiceDescriptor = {
	name: "ui-portal",
	displayName: "Lemn UI",
	description: "Serves the public Lemn UI Catalog and protected Admin.",
	ownerPackage: "@lemn-ltd/ui-portal",
	workerName: "lemn-ui-portal",
	publicOrigin: "https://portal.ui.le-mn.com",
	schemaOrigin: "https://schemas.ui.le-mn.com",
};

function configured(value: string | undefined): boolean {
	return Boolean(value?.trim());
}

function accessAudiencesConfigured(value: string | undefined): boolean {
	const audiences = (value ?? "")
		.split(",")
		.map((audience) => audience.trim())
		.filter(Boolean);
	return (
		audiences.length > 0 &&
		audiences.every((audience) => /^[0-9a-f]{64}$/iu.test(audience))
	);
}

export function validateUiPortalEnv(
	env: UiPortalEnv,
): UiPortalValidationResult {
	const missingBindings = env.ASSETS ? [] : ["ASSETS"];
	const missingConfiguration: string[] = [];
	if (env.DEPLOYMENT_ENVIRONMENT === "production") {
		if (!configured(env.ACCESS_ISSUER))
			missingConfiguration.push("ACCESS_ISSUER");
		if (!accessAudiencesConfigured(env.ACCESS_AUDIENCE))
			missingConfiguration.push("ACCESS_AUDIENCE");
		if (!accessAudiencesConfigured(env.ACCESS_HEALTH_AUDIENCE)) {
			missingConfiguration.push("ACCESS_HEALTH_AUDIENCE");
		}
	}

	return {
		ready: missingBindings.length === 0 && missingConfiguration.length === 0,
		missingBindings,
		missingConfiguration,
	};
}

export function buildStatusReport(env: UiPortalEnv) {
	const validation = validateUiPortalEnv(env);
	return {
		ok: validation.ready,
		service: uiPortalAppDescriptor.name,
		environment: env.DEPLOYMENT_ENVIRONMENT ?? "local",
		build: {
			version: env.BUILD_VERSION ?? "0.0.0",
			gitSha: env.BUILD_GIT_SHA ?? "local",
			time: env.BUILD_TIME ?? "local",
		},
		validation,
	};
}
