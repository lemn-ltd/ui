import {
	Brand,
	Breadcrumb,
	CommandPalette,
	type CommandPaletteGroup,
	ScreenShell,
	SearchCommand,
	Sidebar,
	type SidebarNavGroup,
	ThemeToggle,
	TopBar,
} from "@lemn-ltd/ui";
import { CatalogRenderModeProvider } from "@portal/catalog-kit";
import { type ReactElement, useEffect, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { uiPortalAppDescriptor } from "../../app-descriptor";
import {
	CATALOG_SECTION_MANIFEST,
	PORTAL_HOME_MANIFEST,
} from "../../catalog/catalog-manifest.js";
import { usePortalBrand } from "../branding/brand-runtime";
import { CATALOG_REGISTRY, navGroups } from "../registry/catalog-registry";

export function PortalShell(): ReactElement {
	const location = useLocation();
	const navigate = useNavigate();
	const { mode, setModeByColorScheme } = usePortalBrand();
	const searchParams = new URLSearchParams(location.search);
	const embeddedPlayground = searchParams.get("embed") === "playground";
	const embeddedTheme = searchParams.get("theme") === "dark" ? "dark" : "light";
	const requestedMode = searchParams.get("brandMode");
	const [paletteOpen, setPaletteOpen] = useState(false);

	useEffect(() => {
		if (embeddedPlayground) {
			setModeByColorScheme(embeddedTheme);
			return;
		}
		if (requestedMode === "dark" || requestedMode === "light") {
			setModeByColorScheme(requestedMode);
		}
	}, [embeddedPlayground, embeddedTheme, requestedMode, setModeByColorScheme]);

	if (embeddedPlayground) {
		return (
			<CatalogRenderModeProvider mode="playground">
				<main className="portal-embedded-preview">
					<Outlet />
				</main>
			</CatalogRenderModeProvider>
		);
	}

	const sections = navGroups();
	const sidebarGroups: SidebarNavGroup[] = [
		{
			header: "Explore",
			items: CATALOG_SECTION_MANIFEST.map((entry) => ({
				id: entry.path,
				label: entry.label,
				active: location.pathname === entry.path,
				onSelect: () => navigate(entry.path),
			})),
		},
		...sections.map((section) => ({
			header: section.group,
			items: section.entries.map((entry) => ({
				id: entry.id,
				label: entry.title,
				active: location.pathname === entry.path,
				onSelect: () => navigate(entry.path),
			})),
		})),
	];

	const paletteGroups: CommandPaletteGroup[] = [
		{
			label: "Explore",
			items: CATALOG_SECTION_MANIFEST.map((entry) => ({
				id: entry.path,
				label: entry.label,
				keywords: [entry.summary],
				onSelect: () => navigate(entry.path),
			})),
		},
		...sections.map((section) => ({
			label: section.group,
			items: section.entries.map((entry) => ({
				id: entry.id,
				label: entry.title,
				keywords: [entry.summary, entry.group],
				onSelect: () => navigate(entry.path),
			})),
		})),
	];

	const activeEntry = CATALOG_REGISTRY.find(
		(entry) => entry.path === location.pathname,
	);
	const activeSection = CATALOG_SECTION_MANIFEST.find(
		(entry) => entry.path === location.pathname,
	);

	return (
		<>
			<ScreenShell
				sidebar={
					<Sidebar
						brand={
							<Link
								aria-label="Lemn UI home"
								className="portal-brand-home"
								to={PORTAL_HOME_MANIFEST.path}
							>
								<Brand name={uiPortalAppDescriptor.displayName} />
							</Link>
						}
						groups={sidebarGroups}
						search={<SearchCommand onSelect={() => setPaletteOpen(true)} />}
					/>
				}
				topBar={
					<TopBar
						actions={
							<ThemeToggle
								mode={mode.colorScheme}
								onModeChange={setModeByColorScheme}
							/>
						}
						breadcrumb={
							<Breadcrumb
								items={[
									{ label: uiPortalAppDescriptor.displayName },
									{
										label:
											activeSection?.label ?? activeEntry?.group ?? "Overview",
									},
								]}
							/>
						}
					/>
				}
			>
				<Outlet />
			</ScreenShell>
			<CommandPalette
				groups={paletteGroups}
				onOpenChange={setPaletteOpen}
				open={paletteOpen}
			/>
		</>
	);
}
