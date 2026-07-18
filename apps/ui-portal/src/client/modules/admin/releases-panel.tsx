import type { ReactElement } from "react";
import type { PortalReleaseReadModel } from "./api";

export function ReleasesPanel({
	model,
}: {
	readonly model: PortalReleaseReadModel;
}): ReactElement {
	return (
		<section className="admin-panel" aria-labelledby="release-title">
			<header>
				<div>
					<span>Exact deployed identity</span>
					<h2 id="release-title">Current release</h2>
				</div>
			</header>
			<dl className="admin-detail-list">
				<div>
					<dt>Portal version</dt>
					<dd>{model.version}</dd>
				</div>
				<div>
					<dt>Git SHA</dt>
					<dd>
						<code>{model.gitSha}</code>
					</dd>
				</div>
				<div>
					<dt>Build time</dt>
					<dd>{model.buildTime}</dd>
				</div>
				<div>
					<dt>Worker</dt>
					<dd>
						<code>{model.worker}</code>
					</dd>
				</div>
				<div>
					<dt>Application</dt>
					<dd>
						<code>{model.app}</code>
					</dd>
				</div>
				<div>
					<dt>UI package</dt>
					<dd>
						<code>
							{model.uiPackage.name}@{model.uiPackage.version}
						</code>
					</dd>
				</div>
				<div>
					<dt>Catalog version</dt>
					<dd>{model.catalog.version}</dd>
				</div>
				<div>
					<dt>Provider registry revision</dt>
					<dd>
						<code>{model.catalog.providerRegistryRevision}</code>
					</dd>
				</div>
			</dl>
			<h3>Release receipts</h3>
			{model.receipts.length === 0 ? (
				<div className="admin-empty-state" role="status">
					<strong>No release receipts available</strong>
					<span>The release read model did not declare any receipt.</span>
				</div>
			) : (
				<ul className="admin-receipt-list">
					{model.receipts.map((receipt) => (
						<li data-availability={receipt.availability} key={receipt.id}>
							<strong>{receipt.label}</strong>
							<span>{receipt.detail}</span>
							{receipt.availability === "available" && receipt.immutableUrl ? (
								<a href={receipt.immutableUrl} rel="noreferrer" target="_blank">
									Open immutable receipt
								</a>
							) : (
								<em>Pending exact release metadata</em>
							)}
						</li>
					))}
				</ul>
			)}
			<p>
				Deploy and rollback actions remain outside the browser and require the
				reviewed release workflow.
			</p>
		</section>
	);
}
