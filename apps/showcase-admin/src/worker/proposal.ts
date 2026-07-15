import { PROVIDER_MANIFEST } from "../registry";

const MATURITIES = new Set(["experimental", "beta", "stable", "deprecated"]);

export interface RegistryProposalRequest {
	readonly capabilityId: string;
	readonly maturity?: "experimental" | "beta" | "stable" | "deprecated";
	readonly exactUpstreamReference?: string;
	readonly rationale: string;
}

function proposalRequest(input: unknown): RegistryProposalRequest {
	if (!input || typeof input !== "object" || Array.isArray(input)) {
		throw new Error("Proposal body must be an object.");
	}
	const value = input as Record<string, unknown>;
	if (typeof value.capabilityId !== "string" || value.capabilityId.length > 160) {
		throw new Error("Select a valid capability.");
	}
	if (typeof value.rationale !== "string" || value.rationale.trim().length < 8 || value.rationale.length > 500) {
		throw new Error("Rationale must contain 8 to 500 characters.");
	}
	if (value.maturity !== undefined && (typeof value.maturity !== "string" || !MATURITIES.has(value.maturity))) {
		throw new Error("Maturity is not supported.");
	}
	if (value.exactUpstreamReference !== undefined && (typeof value.exactUpstreamReference !== "string" || value.exactUpstreamReference.length > 300)) {
		throw new Error("Exact upstream reference is invalid.");
	}
	if (value.maturity === undefined && value.exactUpstreamReference === undefined) {
		throw new Error("Propose at least one registry change.");
	}
	return {
		capabilityId: value.capabilityId,
		rationale: value.rationale.trim(),
		...(value.maturity === undefined ? {} : { maturity: value.maturity as RegistryProposalRequest["maturity"] }),
		...(value.exactUpstreamReference === undefined ? {} : { exactUpstreamReference: value.exactUpstreamReference }),
	};
}

async function sha256(value: string): Promise<string> {
	const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
	return [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function buildProposalBundle(input: unknown, requestedBy: string) {
	const proposal = proposalRequest(input);
	const index = PROVIDER_MANIFEST.capabilities.findIndex(
		(capability) => capability.capabilityId === proposal.capabilityId && capability.providerOfRecord,
	);
	const capability = PROVIDER_MANIFEST.capabilities[index];
	if (!capability) throw new Error("The requested capability is unavailable.");

	const operations: Array<Record<string, unknown>> = [];
	if (proposal.maturity && proposal.maturity !== capability.maturity) {
		operations.push({
			op: "replace",
			path: `/capabilities/${index}/maturity`,
			from: capability.maturity,
			value: proposal.maturity,
		});
	}
	if (proposal.exactUpstreamReference) {
		operations.push({
			op: "review-upstream-update",
			path: `/capabilities/${index}/source`,
			from: capability.upstream.upstreamReference,
			value: proposal.exactUpstreamReference,
		});
	}
	if (operations.length === 0) throw new Error("The proposal does not change the current record.");

	const payload = {
		proposalVersion: 1,
		base: {
			registryId: PROVIDER_MANIFEST.registryId,
			revision: PROVIDER_MANIFEST.revision,
			manifestPath: PROVIDER_MANIFEST.sourceOfTruth.path,
		},
		capabilityId: proposal.capabilityId,
		requestedBy,
		rationale: proposal.rationale,
		operations,
		governance: {
			authority: "git_manifest",
			activeManifestMutated: false,
			nextAction: "Submit through an AgentOps GitHub-sync plan and reviewed pull request.",
		},
	};
	const digest = await sha256(JSON.stringify(payload));
	return { proposalId: `registry-proposal-${digest.slice(0, 16)}`, digest, ...payload };
}
