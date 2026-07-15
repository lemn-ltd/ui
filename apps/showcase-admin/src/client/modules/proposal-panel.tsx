import { Alert, Button, Input, SelectNative, Textarea } from "@lemn-ltd/ui";
import { type FormEvent, type ReactElement, useState } from "react";
import type { AdminRegistryReadModel } from "../../registry";
import { adminApi } from "../api";

type ProposalState =
	| { readonly state: "idle" }
	| { readonly state: "pending" }
	| { readonly state: "success"; readonly bundle: Record<string, unknown> }
	| { readonly state: "error"; readonly message: string };

export function ProposalPanel({ model }: { readonly model: AdminRegistryReadModel }): ReactElement {
	const [capabilityId, setCapabilityId] = useState(model.capabilities[0]?.capabilityId ?? "");
	const [maturity, setMaturity] = useState("beta");
	const [reference, setReference] = useState("");
	const [rationale, setRationale] = useState("Review this governed provider capability update.");
	const [result, setResult] = useState<ProposalState>({ state: "idle" });

	const submit = async (event: FormEvent): Promise<void> => {
		event.preventDefault();
		setResult({ state: "pending" });
		try {
			const bundle = await adminApi.proposal({
				capabilityId,
				maturity,
				...(reference.trim() ? { exactUpstreamReference: reference.trim() } : {}),
				rationale,
			});
			setResult({ state: "success", bundle });
		} catch (error) {
			setResult({ state: "error", message: error instanceof Error ? error.message : "Proposal failed." });
		}
	};

	return (
		<section className="admin-panel" aria-labelledby="proposal-title">
			<header><div><span>Plan, review, apply elsewhere</span><h2 id="proposal-title">Registry proposal</h2></div></header>
			<Alert
				message="This form creates a proposal bundle only. It cannot mutate the active manifest or publish a UI release."
				title="Pull-request governed"
				variant="info"
			/>
			<form className="admin-form" onSubmit={(event) => void submit(event)}>
				<label><span>Capability</span><SelectNative aria-label="Proposal capability" onValueChange={setCapabilityId} options={model.capabilities.map((capability) => ({ label: `${capability.publicExport} · ${capability.provider.name}`, value: capability.capabilityId }))} value={capabilityId} /></label>
				<label><span>Requested maturity</span><SelectNative aria-label="Requested maturity" onValueChange={setMaturity} options={["experimental", "beta", "stable", "deprecated"].map((value) => ({ label: value, value }))} value={maturity} /></label>
				<label><span>Exact upstream reference (optional)</span><Input onChange={(event) => setReference(event.currentTarget.value)} placeholder="package@1.2.3 or repository#full-SHA" value={reference} /></label>
				<label><span>Rationale</span><Textarea onChange={(event) => setRationale(event.currentTarget.value)} rows={4} value={rationale} /></label>
				<Button disabled={result.state === "pending" || !capabilityId} type="submit">{result.state === "pending" ? "Generating…" : "Generate proposal bundle"}</Button>
			</form>
			{result.state === "error" ? <Alert message={result.message} title="Proposal rejected" variant="error" /> : null}
			{result.state === "success" ? <div className="admin-json"><strong>Non-mutating proposal bundle</strong><pre>{JSON.stringify(result.bundle, null, 2)}</pre></div> : null}
		</section>
	);
}
