import type { ReactElement } from "react";
import type { PortalSettingsReadModel } from "./api";

export function SettingsPanel({
	model,
}: {
	readonly model: PortalSettingsReadModel;
}): ReactElement {
	return (
		<section className="admin-panel" aria-labelledby="settings-title">
			<header>
				<div>
					<span>Effective read-only configuration</span>
					<h2 id="settings-title">Settings</h2>
				</div>
			</header>
			<dl className="admin-detail-list">
				<div>
					<dt>Application</dt>
					<dd>{model.displayName}</dd>
				</div>
				<div>
					<dt>Environment</dt>
					<dd>{model.environment}</dd>
				</div>
				<div>
					<dt>Enabled areas</dt>
					<dd>{model.enabledAreas.join(", ")}</dd>
				</div>
				<div>
					<dt>Admin authorization</dt>
					<dd>{model.security.adminOriginAuthorization}</dd>
				</div>
				<div>
					<dt>Human capability</dt>
					<dd>{model.security.adminRole}</dd>
				</div>
				<div>
					<dt>Service capability</dt>
					<dd>{model.security.serviceCapability}</dd>
				</div>
				<div>
					<dt>Studio persistence</dt>
					<dd>{model.studioPersistence}</dd>
				</div>
				<div>
					<dt>Assets binding</dt>
					<dd data-config-state={model.operationalConfiguration.assets.state}>
						{model.operationalConfiguration.assets.maskedValue}
					</dd>
				</div>
				<div>
					<dt>Access issuer</dt>
					<dd
						data-config-state={
							model.operationalConfiguration.accessIssuer.state
						}
					>
						{model.operationalConfiguration.accessIssuer.maskedValue}
					</dd>
				</div>
				<div>
					<dt>Admin audiences</dt>
					<dd
						data-config-state={
							model.operationalConfiguration.adminAudiences.state
						}
					>
						{model.operationalConfiguration.adminAudiences.maskedValue} ·{" "}
						{model.operationalConfiguration.adminAudiences.count}
					</dd>
				</div>
				<div>
					<dt>Health audience</dt>
					<dd
						data-config-state={
							model.operationalConfiguration.healthAudience.state
						}
					>
						{model.operationalConfiguration.healthAudience.maskedValue} ·{" "}
						{model.operationalConfiguration.healthAudience.count}
					</dd>
				</div>
				<div>
					<dt>Theme preference</dt>
					<dd>{model.localPreferences.theme}</dd>
				</div>
				<div>
					<dt>Durable browser writes</dt>
					<dd>
						{model.localPreferences.durableWrites ? "enabled" : "disabled"}
					</dd>
				</div>
			</dl>
			<p>
				Local theme preferences stay in this browser. Cloudflare and durable
				branding changes are intentionally unavailable here.
			</p>
		</section>
	);
}
