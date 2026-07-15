import type { ReactElement } from "react";
import type { AdminRegistryReadModel } from "../../registry";

export function ConformancePanel({ model }: { readonly model: AdminRegistryReadModel }): ReactElement {
	return (
		<section className="admin-panel" aria-labelledby="conformance-title">
			<header><div><span>Evidence, not intent</span><h2 id="conformance-title">Conformance coverage</h2></div></header>
			<div className="admin-conformance-grid">
				{model.capabilities.map((capability) => (
					<article key={capability.capabilityId}>
						<h3>{capability.publicExport}</h3>
						<code>{capability.capabilityId}</code>
						<dl>
							{Object.entries(capability.conformanceCoverage).map(([kind, count]) => <div key={kind}><dt>{kind}</dt><dd>{count}</dd></div>)}
						</dl>
						{capability.licenseRequirements.map((requirement) => <p key={requirement}>{requirement}</p>)}
					</article>
				))}
			</div>
		</section>
	);
}
