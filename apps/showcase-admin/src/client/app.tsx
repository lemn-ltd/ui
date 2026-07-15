import { Alert, Button } from "@lemn-ltd/ui";
import { type ReactElement, useEffect, useState } from "react";
import type { AdminRegistryReadModel } from "../registry";
import { adminApi } from "./api";
import { BrandStudioPanel } from "./modules/brand-studio-panel";
import { ConformancePanel } from "./modules/conformance-panel";
import { ProposalPanel } from "./modules/proposal-panel";
import { RegistryPanel } from "./modules/registry-panel";

type View = "registry" | "conformance" | "proposal" | "studio";
type RegistryState =
	| { readonly state: "loading" }
	| { readonly state: "error"; readonly message: string }
	| { readonly state: "success"; readonly model: AdminRegistryReadModel };

const VIEWS: readonly { readonly id: View; readonly label: string }[] = [
	{ id: "registry", label: "Mappings" },
	{ id: "conformance", label: "Conformance" },
	{ id: "proposal", label: "Proposals" },
	{ id: "studio", label: "Brand Studio" },
];

export function ShowcaseAdminApp(): ReactElement {
	const [view, setView] = useState<View>("registry");
	const [reload, setReload] = useState(0);
	const [registry, setRegistry] = useState<RegistryState>({ state: "loading" });

	useEffect(() => {
		let current = true;
		setRegistry({ state: "loading" });
		void adminApi.registry().then(
			(model) => current && setRegistry({ state: "success", model }),
			(error: unknown) => current && setRegistry({ state: "error", message: error instanceof Error ? error.message : "Registry loading failed." }),
		);
		return () => { current = false; };
	}, [reload]);

	return (
		<div className="showcase-admin-app">
			<header className="admin-topbar">
				<a className="admin-brand" href="/" aria-label="Showcase Admin home"><span>LEMN UI</span><strong>Showcase Admin</strong></a>
				<div><span className="admin-protected">Cloudflare Access protected</span><a href="https://showcase.ui.le-mn.com">Public Showcase ↗</a></div>
			</header>
			<div className="admin-shell">
				<aside>
					<p>Governance workspace</p>
					<nav aria-label="Admin sections">
						{VIEWS.map((item) => <button aria-current={view === item.id ? "page" : undefined} key={item.id} onClick={() => setView(item.id)} type="button">{item.label}</button>)}
					</nav>
					<small>Git remains the authority for provider mappings. AgentOps remains the authority for project branding.</small>
				</aside>
				<main>
					<div className="admin-page-heading"><span>Controlled operations</span><h1>{VIEWS.find((item) => item.id === view)?.label}</h1><p>Inspect evidence and create explicit plans without granting the browser direct authority.</p></div>
					{view === "studio" ? <BrandStudioPanel /> : null}
					{view !== "studio" && registry.state === "loading" ? <div className="admin-loading" role="status">Loading the provider registry…</div> : null}
					{view !== "studio" && registry.state === "error" ? <div className="admin-error-state"><Alert message={registry.message} title="Registry unavailable" variant="error" /><Button onClick={() => setReload((value) => value + 1)}>Retry</Button></div> : null}
					{registry.state === "success" && view === "registry" ? <RegistryPanel model={registry.model} /> : null}
					{registry.state === "success" && view === "conformance" ? <ConformancePanel model={registry.model} /> : null}
					{registry.state === "success" && view === "proposal" ? <ProposalPanel model={registry.model} /> : null}
				</main>
			</div>
		</div>
	);
}
