import { Alert, Button } from "@lemn-ltd/ui";
import { type ReactElement, useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import type { AdminRegistryReadModel } from "../../../catalog/admin-registry";
import {
	AdminEmptyState,
	AdminLoadingState,
	AdminResourceError,
	type AdminResourceState,
	toAdminResourceFailure,
} from "./admin-resource-state";
import {
	type AdminSession,
	adminApi,
	type PortalConformanceReadModel,
	type PortalReleaseReadModel,
	type PortalSettingsReadModel,
} from "./api";
import { BrandStudioPanel } from "./brand-studio-panel";
import { ConformancePanel } from "./conformance-panel";
import { ProposalPanel } from "./proposal-panel";
import { RegistryPanel } from "./registry-panel";
import { ReleasesPanel } from "./releases-panel";
import { SettingsPanel } from "./settings-panel";
import "./admin.css";

const ADMIN_ROUTES = [
	{ path: "/admin", label: "Overview" },
	{ path: "/admin/registry", label: "Registry" },
	{ path: "/admin/conformance", label: "Conformance" },
	{ path: "/admin/brand-studio", label: "Brand Studio" },
	{ path: "/admin/releases", label: "Releases" },
	{ path: "/admin/settings", label: "Settings" },
] as const;

export default function AdminPortal(): ReactElement {
	const { pathname } = useLocation();
	const [sessionReload, setSessionReload] = useState(0);
	const [resourceReload, setResourceReload] = useState(0);
	const [session, setSession] = useState<AdminResourceState<AdminSession>>({
		state: "loading",
	});
	const [registry, setRegistry] = useState<
		AdminResourceState<AdminRegistryReadModel>
	>({ state: "loading" });
	const [conformance, setConformance] = useState<
		AdminResourceState<PortalConformanceReadModel>
	>({ state: "loading" });
	const [release, setRelease] = useState<
		AdminResourceState<PortalReleaseReadModel>
	>({ state: "loading" });
	const [settings, setSettings] = useState<
		AdminResourceState<PortalSettingsReadModel>
	>({ state: "loading" });

	useEffect(() => {
		let current = true;
		setSession({ state: "loading" });
		void adminApi.session().then(
			(data) => current && setSession({ state: "success", data }),
			(error) =>
				current &&
				setSession(toAdminResourceFailure(error, "Admin session unavailable.")),
		);
		return () => {
			current = false;
		};
	}, [sessionReload]);

	useEffect(() => {
		if (session.state !== "success") return;
		let current = true;
		if (pathname === "/admin/registry") {
			setRegistry({ state: "loading" });
			void adminApi.registry().then(
				(data) => current && setRegistry({ state: "success", data }),
				(error) =>
					current &&
					setRegistry(
						toAdminResourceFailure(error, "Registry loading failed."),
					),
			);
		}
		if (pathname === "/admin/conformance") {
			setConformance({ state: "loading" });
			void adminApi.conformance().then(
				(data) => current && setConformance({ state: "success", data }),
				(error) =>
					current &&
					setConformance(
						toAdminResourceFailure(error, "Conformance loading failed."),
					),
			);
		}
		if (pathname === "/admin/releases") {
			setRelease({ state: "loading" });
			void adminApi.release().then(
				(data) => current && setRelease({ state: "success", data }),
				(error) =>
					current &&
					setRelease(toAdminResourceFailure(error, "Release loading failed.")),
			);
		}
		if (pathname === "/admin/settings") {
			setSettings({ state: "loading" });
			void adminApi.settings().then(
				(data) => current && setSettings({ state: "success", data }),
				(error) =>
					current &&
					setSettings(
						toAdminResourceFailure(error, "Settings loading failed."),
					),
			);
		}
		return () => {
			current = false;
		};
	}, [pathname, resourceReload, session.state]);

	if (session.state === "loading") {
		return (
			<main className="admin-access-state" role="status">
				Verifying Admin identity…
			</main>
		);
	}
	if (session.state === "error") {
		const denied = session.status === 401 || session.status === 403;
		return (
			<main className="admin-access-state">
				<Alert
					message={session.message}
					title={denied ? "Permission required" : "Admin unavailable"}
					variant="error"
				/>
				<Button onClick={() => setSessionReload((value) => value + 1)}>
					Retry
				</Button>
			</main>
		);
	}

	const active = ADMIN_ROUTES.find((route) => route.path === pathname);
	const retry = (): void => setResourceReload((value) => value + 1);
	return (
		<div className="portal-admin-app">
			<header className="admin-topbar">
				<Link
					className="admin-brand"
					to="/admin"
					aria-label="Lemn UI Admin home"
				>
					<strong>Lemn UI</strong>
					<span>Admin</span>
				</Link>
				<div>
					<span
						className="admin-protected"
						data-mode={session.data.operationalAccess.state}
					>
						{session.data.operationalAccess.label}
					</span>
					<Link to="/">Public catalog</Link>
					<span>{session.data.identity.email}</span>
				</div>
			</header>
			<div className="admin-shell">
				<aside>
					<p>Governance workspace</p>
					<nav aria-label="Admin sections">
						{ADMIN_ROUTES.map((item) => (
							<Link
								aria-current={pathname === item.path ? "page" : undefined}
								key={item.path}
								to={item.path}
							>
								{item.label}
							</Link>
						))}
					</nav>
					<small>
						Git owns provider mappings. Brand Studio remains persistence-free.
						Releases are operator-owned.
					</small>
				</aside>
				<main>
					<div className="admin-page-heading">
						<span>Controlled operations</span>
						<h1>{active?.label ?? "Admin route not found"}</h1>
						<p>
							Read verified state and generate reviewable intents without direct
							browser authority.
						</p>
					</div>
					{!active ? (
						<Alert
							message="This Admin route does not exist."
							title="Not found"
							variant="error"
						/>
					) : null}
					{pathname === "/admin" ? (
						<section className="admin-panel">
							<h2>Portal governance</h2>
							<p>
								Inspect the Git-owned provider registry, immutable conformance
								evidence, current release identity, effective security
								configuration, and the local Brand Studio contract lab.
							</p>
						</section>
					) : null}
					{pathname === "/admin/brand-studio" ? <BrandStudioPanel /> : null}
					{pathname === "/admin/registry" && registry.state === "loading" ? (
						<AdminLoadingState message="Loading verified Registry data…" />
					) : null}
					{pathname === "/admin/registry" && registry.state === "error" ? (
						<AdminResourceError error={registry} onRetry={retry} />
					) : null}
					{pathname === "/admin/registry" && registry.state === "success" ? (
						registry.data.capabilities.length > 0 ? (
							<>
								<RegistryPanel model={registry.data} />
								<ProposalPanel model={registry.data} />
							</>
						) : (
							<AdminEmptyState
								detail="The Git-authoritative manifest has no enabled Core provider mappings."
								title="No provider mappings"
							/>
						)
					) : null}
					{pathname === "/admin/conformance" &&
					conformance.state === "loading" ? (
						<AdminLoadingState message="Loading immutable Conformance receipts…" />
					) : null}
					{pathname === "/admin/conformance" &&
					conformance.state === "error" ? (
						<AdminResourceError error={conformance} onRetry={retry} />
					) : null}
					{pathname === "/admin/conformance" &&
					conformance.state === "success" ? (
						<ConformancePanel model={conformance.data} />
					) : null}
					{pathname === "/admin/releases" && release.state === "loading" ? (
						<AdminLoadingState message="Loading exact release identity…" />
					) : null}
					{pathname === "/admin/releases" && release.state === "error" ? (
						<AdminResourceError error={release} onRetry={retry} />
					) : null}
					{pathname === "/admin/releases" && release.state === "success" ? (
						<ReleasesPanel model={release.data} />
					) : null}
					{pathname === "/admin/settings" && settings.state === "loading" ? (
						<AdminLoadingState message="Loading effective masked configuration…" />
					) : null}
					{pathname === "/admin/settings" && settings.state === "error" ? (
						<AdminResourceError error={settings} onRetry={retry} />
					) : null}
					{pathname === "/admin/settings" && settings.state === "success" ? (
						<SettingsPanel model={settings.data} />
					) : null}
				</main>
			</div>
		</div>
	);
}
