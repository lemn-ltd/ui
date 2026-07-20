import type { AdminRegistryReadModel } from "../../../catalog/admin-registry";

export interface AdminSession {
	readonly requestId: string;
	readonly operationalAccess:
		| {
				readonly state: "cloudflare-access";
				readonly label: "Cloudflare Access protected";
		  }
		| {
				readonly state: "test-origin-gate";
				readonly label: "Access disabled · test origin gate";
		  }
		| {
				readonly state: "local-development";
				readonly label: "Local development gate";
		  };
	readonly identity: {
		readonly kind: "human";
		readonly email: string;
		readonly role: "portal-admin";
	};
	readonly capabilities: readonly ["portal-admin"];
}

export interface PortalReleaseReadModel {
	readonly app: "@lemn-ltd/ui-portal";
	readonly worker: "lemn-ui-portal";
	readonly version: string;
	readonly gitSha: string;
	readonly buildTime: string;
	readonly uiPackage: {
		readonly name: "@lemn-ltd/ui";
		readonly version: string;
	};
	readonly catalog: {
		readonly version: string;
		readonly providerRegistryRevision: string;
	};
	readonly receipts: readonly PortalReleaseReceipt[];
}

export interface PortalReleaseReceipt {
	readonly id: string;
	readonly label: string;
	readonly availability: "available" | "pending";
	readonly immutableUrl?: string;
	readonly detail: string;
}

export interface PortalConformanceReceipt {
	readonly path: string;
	readonly gates: readonly string[];
	readonly capabilityIds: readonly string[];
	readonly verification:
		| {
				readonly state: "commit-pinned";
				readonly immutableUrl: string;
		  }
		| {
				readonly state: "local-unpinned";
				readonly reason: string;
		  };
}

export interface PortalConformanceReadModel {
	readonly authority: "git-provider-registry";
	readonly registryRevision: string;
	readonly gitSha: string;
	readonly verificationCommand: string;
	readonly receipts: readonly PortalConformanceReceipt[];
}

export interface PortalSettingsReadModel {
	readonly displayName: "Lemn UI";
	readonly environment: string;
	readonly enabledAreas: readonly string[];
	readonly security: {
		readonly adminOriginAuthorization:
			| "cloudflare-access-jwt"
			| "test-origin-gate"
			| "local-development";
		readonly adminRole: "portal-admin";
		readonly serviceCapability: "health-only";
	};
	readonly studioPersistence: "none";
	readonly operationalConfiguration: {
		readonly assets: MaskedOperationalConfiguration;
		readonly accessIssuer: MaskedOperationalConfiguration;
		readonly adminAudiences: MaskedOperationalConfiguration & {
			readonly count: number;
		};
		readonly healthAudience: MaskedOperationalConfiguration & {
			readonly count: number;
		};
	};
	readonly localPreferences: {
		readonly theme: "browser-local";
		readonly durableWrites: false;
	};
}

export interface MaskedOperationalConfiguration {
	readonly state: "configured" | "missing";
	readonly maskedValue: string;
}

export class AdminApiError extends Error {
	public constructor(
		public readonly status: number,
		message: string,
		public readonly code?: string,
		public readonly requestId?: string,
	) {
		super(message);
	}
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
	const response = await fetch(path, {
		...init,
		headers: init?.body
			? { "content-type": "application/json", ...init.headers }
			: init?.headers,
	});
	if (!response.ok) {
		const body = (await response.json().catch(() => ({}))) as {
			code?: string;
			detail?: string;
			requestId?: string;
		};
		throw new AdminApiError(
			response.status,
			body.detail ?? "The Admin request failed.",
			body.code,
			body.requestId,
		);
	}
	return response.json() as Promise<T>;
}

export const adminApi = {
	session: (): Promise<AdminSession> => request("/api/admin/session"),
	registry: (): Promise<AdminRegistryReadModel> =>
		request("/api/admin/registry"),
	conformance: (): Promise<PortalConformanceReadModel> =>
		request("/api/admin/conformance"),
	release: (): Promise<PortalReleaseReadModel> =>
		request("/api/admin/releases/current"),
	settings: (): Promise<PortalSettingsReadModel> =>
		request("/api/admin/settings"),
	proposal(input: {
		capabilityId: string;
		maturity?: string;
		exactUpstreamReference?: string;
		rationale: string;
	}): Promise<Record<string, unknown>> {
		return request("/api/admin/registry/proposals", {
			method: "POST",
			body: JSON.stringify(input),
		});
	},
};
