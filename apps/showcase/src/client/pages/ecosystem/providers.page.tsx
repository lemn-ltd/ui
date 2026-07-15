import { Badge, ContentLayout } from "@lemn-ltd/ui";
import type { ReactElement } from "react";
import { PROVIDER_READ_MODEL } from "../../../provider-read-model";

export function ProvidersPage(): ReactElement {
	return (
		<ContentLayout className="showcase-ecosystem-page">
			<header className="showcase-ecosystem-page__header">
				<span>Provider provenance</span>
				<h1>One provider of record per capability</h1>
				<p>
					This read-only view is derived from registry revision {" "}
					<code>{PROVIDER_READ_MODEL.revision}</code>. Products consume LEMN
					exports, never provider packages directly.
				</p>
			</header>
			<div className="showcase-provider-table-wrap" role="region" tabIndex={0}>
				<table className="showcase-provider-table">
					<thead>
						<tr>
							<th scope="col">Capability</th>
							<th scope="col">LEMN export</th>
							<th scope="col">Provider</th>
							<th scope="col">Exact source</th>
							<th scope="col">License</th>
							<th scope="col">Status</th>
						</tr>
					</thead>
					<tbody>
						{PROVIDER_READ_MODEL.capabilities.map((capability) => (
							<tr key={capability.capabilityId}>
								<th scope="row"><code>{capability.capabilityId}</code></th>
								<td><code>{capability.publicExport}</code></td>
								<td>{capability.provider.name}</td>
								<td><code>{capability.exactUpstreamReference}</code></td>
								<td>{capability.license.spdx}</td>
								<td>
									<Badge tone={capability.maturity === "stable" ? "success" : "warn"}>
										{capability.maturity}
									</Badge>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</ContentLayout>
	);
}
