import type { ReactElement } from "react";
import type { PortalConformanceReadModel } from "./api";

export function ConformancePanel({
	model,
}: {
	readonly model: PortalConformanceReadModel;
}): ReactElement {
	return (
		<section className="admin-panel" aria-labelledby="conformance-title">
			<header>
				<div>
					<span>Evidence, not intent</span>
					<h2 id="conformance-title">Conformance receipts</h2>
				</div>
				<code>registry {model.registryRevision}</code>
			</header>
			<p>
				These are the exact repository evidence paths enforced by the provider
				registry gate. A commit-pinned link is shown only when the deployed
				build has an immutable Git SHA; this Worker does not claim to execute
				CI.
			</p>
			<dl className="admin-detail-list">
				<div>
					<dt>Authority</dt>
					<dd>{model.authority}</dd>
				</div>
				<div>
					<dt>Build revision</dt>
					<dd>
						<code>{model.gitSha}</code>
					</dd>
				</div>
				<div>
					<dt>Verification gate</dt>
					<dd>
						<code>{model.verificationCommand}</code>
					</dd>
				</div>
			</dl>
			{model.receipts.length === 0 ? (
				<div className="admin-empty-state" role="status">
					<strong>No conformance receipts declared</strong>
					<span>The Git registry currently references no evidence paths.</span>
				</div>
			) : (
				<div className="admin-conformance-grid">
					{model.receipts.map((receipt) => (
						<article key={receipt.path}>
							<h3>{receipt.gates.join(" · ")}</h3>
							<code>{receipt.path}</code>
							<p>{receipt.capabilityIds.length} capability declarations</p>
							{receipt.verification.state === "commit-pinned" ? (
								<a
									href={receipt.verification.immutableUrl}
									rel="noreferrer"
									target="_blank"
								>
									Open immutable evidence
								</a>
							) : (
								<p className="admin-receipt-pending">
									{receipt.verification.reason}
								</p>
							)}
						</article>
					))}
				</div>
			)}
		</section>
	);
}
