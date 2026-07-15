import { Badge } from "@lemn-ltd/ui";
import type { ReactElement } from "react";
import type { AdminRegistryReadModel } from "../../registry";

export function RegistryPanel({ model }: { readonly model: AdminRegistryReadModel }): ReactElement {
	return (
		<section className="admin-panel" aria-labelledby="registry-title">
			<header><div><span>Git-owned authority</span><h2 id="registry-title">Provider mappings</h2></div><code>{model.revision}</code></header>
			<div className="admin-table-wrap" role="region" tabIndex={0}>
				<table>
					<thead><tr><th>Capability</th><th>Provider / mapping</th><th>Exact upstream</th><th>License</th><th>Patches</th><th>Status</th></tr></thead>
					<tbody>
						{model.capabilities.map((capability) => (
							<tr key={capability.capabilityId}>
								<th scope="row"><code>{capability.capabilityId}</code><small>{capability.publicExport}</small></th>
								<td><strong>{capability.provider.name}</strong><small>{capability.adapters.publicApi}</small></td>
								<td><code>{capability.exactUpstreamReference}</code></td>
								<td><strong>{capability.license.spdx}</strong><small>{capability.license.reviewClass}</small></td>
								<td>{capability.patches.length}<small>{capability.transforms.length} transforms</small></td>
								<td><Badge tone={capability.maturity === "stable" ? "success" : "warn"}>{capability.maturity}</Badge><small>{capability.upstream.updateStatus}</small></td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</section>
	);
}
