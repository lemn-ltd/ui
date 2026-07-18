import { Alert, Badge, Button, ContentLayout } from "@lemn-ltd/ui";
import type { ProviderRegistryReadModel } from "@lemn-ltd/provider-registry";
import { type ReactElement, useEffect, useState } from "react";

type ProviderState =
	| { readonly state: "loading" }
	| { readonly state: "error"; readonly message: string }
	| { readonly state: "success"; readonly model: ProviderRegistryReadModel };

export function ProvidersPage(): ReactElement {
	const [reload, setReload] = useState(0);
	const [state, setState] = useState<ProviderState>({ state: "loading" });
	useEffect(() => {
		let current = true;
		setState({ state: "loading" });
		void fetch("/provider-registry.json")
			.then(async (response) => {
				if (!response.ok) throw new Error("Provider registry request failed.");
				return response.json() as Promise<ProviderRegistryReadModel>;
			})
			.then(
				(model) => current && setState({ state: "success", model }),
				(error: unknown) => current && setState({ state: "error", message: error instanceof Error ? error.message : "Provider registry unavailable." }),
			);
		return () => { current = false; };
	}, [reload]);

	return (
		<ContentLayout className="portal-ecosystem-page">
			<header className="portal-ecosystem-page__header">
				<span>Provider provenance</span>
				<h1>One provider of record per capability</h1>
				<p>Products consume Lemn UI exports, never provider packages directly.</p>
			</header>
			{state.state === "loading" ? <div className="portal-page-fallback" role="status">Loading provider evidence…</div> : null}
			{state.state === "error" ? <div className="portal-error-state"><Alert message={state.message} title="Providers unavailable" variant="error" /><Button onClick={() => setReload((value) => value + 1)}>Retry</Button></div> : null}
			{state.state === "success" && state.model.capabilities.length === 0 ? <div className="portal-empty-state" role="status">No provider mappings are enabled.</div> : null}
			{state.state === "success" && state.model.capabilities.length > 0 ? (
				<div className="portal-provider-table-wrap" role="region" tabIndex={0}>
					<p>Registry revision <code>{state.model.revision}</code></p>
					<table className="portal-provider-table">
						<thead><tr><th scope="col">Capability</th><th scope="col">Lemn UI export</th><th scope="col">Provider</th><th scope="col">Exact source</th><th scope="col">Ingestion</th><th scope="col">License</th><th scope="col">Status</th></tr></thead>
						<tbody>{state.model.capabilities.map((capability) => (
							<tr key={capability.capabilityId}>
								<th scope="row"><code>{capability.capabilityId}</code></th>
								<td><code>{capability.publicExport}</code></td><td>{capability.provider.name}</td>
								<td><code>{capability.exactUpstreamReference}</code></td><td><code>{capability.ingestionMode}</code></td>
								<td>{capability.license.spdx}</td><td><Badge tone={capability.maturity === "stable" ? "success" : "warn"}>{capability.maturity}</Badge></td>
							</tr>
						))}</tbody>
					</table>
				</div>
			) : null}
		</ContentLayout>
	);
}
