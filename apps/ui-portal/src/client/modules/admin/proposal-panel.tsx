import { Alert, Button, Input, SelectNative, Textarea } from "@lemn-ltd/ui";
import { type FormEvent, type ReactElement, useState } from "react";
import type { AdminRegistryReadModel } from "../../../catalog/admin-registry";
import { AdminApiError, adminApi } from "./api";

type ProposalState =
	| { readonly state: "idle" }
	| { readonly state: "pending" }
	| { readonly state: "success"; readonly bundle: Record<string, unknown> }
	| {
			readonly state: "conflict" | "error";
			readonly message: string;
			readonly requestId?: string;
	  };

export function ProposalPanel({
	model,
}: {
	readonly model: AdminRegistryReadModel;
}): ReactElement {
	const [capabilityId, setCapabilityId] = useState(
		model.capabilities[0]?.capabilityId ?? "",
	);
	const [maturity, setMaturity] = useState("beta");
	const [reference, setReference] = useState("");
	const [rationale, setRationale] = useState(
		"Review this governed provider capability update.",
	);
	const [result, setResult] = useState<ProposalState>({ state: "idle" });

	const submit = async (event: FormEvent): Promise<void> => {
		event.preventDefault();
		setResult({ state: "pending" });
		try {
			const bundle = await adminApi.proposal({
				capabilityId,
				maturity,
				...(reference.trim()
					? { exactUpstreamReference: reference.trim() }
					: {}),
				rationale,
			});
			setResult({ state: "success", bundle });
		} catch (error) {
			setResult({
				state:
					error instanceof AdminApiError && error.status === 409
						? "conflict"
						: "error",
				message: error instanceof Error ? error.message : "Proposal failed.",
				...(error instanceof AdminApiError && error.requestId
					? { requestId: error.requestId }
					: {}),
			});
		}
	};

	return (
		<section className="admin-panel" aria-labelledby="proposal-title">
			<header>
				<div>
					<span>Plan, review, apply elsewhere</span>
					<h2 id="proposal-title">Registry proposal</h2>
				</div>
			</header>
			<Alert
				message="This form creates a proposal bundle only. It cannot mutate the active manifest or publish a UI release."
				title="Pull-request governed"
				variant="info"
			/>
			<form className="admin-form" onSubmit={(event) => void submit(event)}>
				<label htmlFor="admin-proposal-capability">
					<span>Capability</span>
					<SelectNative
						aria-label="Proposal capability"
						id="admin-proposal-capability"
						onValueChange={setCapabilityId}
						options={model.capabilities.map((capability) => ({
							label: `${capability.publicExport} · ${capability.provider.name}`,
							value: capability.capabilityId,
						}))}
						value={capabilityId}
					/>
				</label>
				<label htmlFor="admin-proposal-maturity">
					<span>Requested maturity</span>
					<SelectNative
						aria-label="Requested maturity"
						id="admin-proposal-maturity"
						onValueChange={setMaturity}
						options={["experimental", "beta", "stable", "deprecated"].map(
							(value) => ({ label: value, value }),
						)}
						value={maturity}
					/>
				</label>
				<label htmlFor="admin-proposal-reference">
					<span>Exact upstream reference (optional)</span>
					<Input
						id="admin-proposal-reference"
						onChange={(event) => setReference(event.currentTarget.value)}
						placeholder="package@1.2.3 or repository#full-SHA"
						value={reference}
					/>
				</label>
				<label htmlFor="admin-proposal-rationale">
					<span>Rationale</span>
					<Textarea
						id="admin-proposal-rationale"
						onChange={(event) => setRationale(event.currentTarget.value)}
						rows={4}
						value={rationale}
					/>
				</label>
				<Button
					disabled={result.state === "pending" || !capabilityId}
					type="submit"
				>
					{result.state === "pending"
						? "Generating…"
						: "Generate proposal bundle"}
				</Button>
			</form>
			{result.state === "error" || result.state === "conflict" ? (
				<div className="admin-error-state" data-proposal-state={result.state}>
					<Alert
						message={result.message}
						title={
							result.state === "conflict"
								? "Proposal conflict"
								: "Proposal rejected"
						}
						variant="error"
					/>
					{result.requestId ? (
						<small>
							Support request <code>{result.requestId}</code>
						</small>
					) : null}
				</div>
			) : null}
			{result.state === "success" ? (
				<div className="admin-json">
					<strong>Non-mutating proposal bundle</strong>
					<pre>{JSON.stringify(result.bundle, null, 2)}</pre>
				</div>
			) : null}
		</section>
	);
}
