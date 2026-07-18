import { Button } from "@lemn-ltd/ui";
import { CatalogEntryProvider } from "@portal/catalog-kit";
import { lazy, type ReactElement, Suspense } from "react";
import {
	createBrowserRouter,
	isRouteErrorResponse,
	type RouteObject,
	useRouteError,
} from "react-router-dom";
import {
	PUBLIC_PAGE_MANIFEST,
	type PublicPageId,
} from "../../catalog/catalog-manifest.js";
import { CATALOG_REGISTRY } from "../registry/catalog-registry.js";
import { publicPageFor } from "../registry/public-page-bindings.js";
import { NotFoundPage } from "../shell/not-found-page.js";
import { PortalShell } from "../shell/portal-shell.js";

const AdminPortal = lazy(() => import("../modules/admin/admin-portal.js"));

export function PortalPageFallback(): ReactElement {
	return (
		<div
			className="portal-page-fallback"
			data-portal-route-state="loading"
			role="status"
		>
			Loading…
		</div>
	);
}

export function PortalRouteError(): ReactElement {
	const error = useRouteError();
	const detail = isRouteErrorResponse(error)
		? `${error.status} ${error.statusText}`
		: error instanceof Error
			? error.message
			: "Unknown route error";
	return (
		<section
			className="portal-route-error"
			data-portal-route-state="error"
			role="alert"
		>
			<h1>Page unavailable</h1>
			<p>{detail}</p>
			<Button onClick={() => window.location.reload()} variant="outline">
				Reload page
			</Button>
		</section>
	);
}

function suspense(element: ReactElement): ReactElement {
	return <Suspense fallback={<PortalPageFallback />}>{element}</Suspense>;
}

function publicPageRoute(
	page: (typeof PUBLIC_PAGE_MANIFEST)[number],
): RouteObject {
	const route = {
		errorElement: <PortalRouteError />,
		element: suspense(publicPageFor(page.id as PublicPageId)),
	};
	return page.path === "/"
		? { ...route, index: true }
		: { ...route, path: page.path.slice(1) };
}

const entryRoutes: RouteObject[] = CATALOG_REGISTRY.map((entry) => ({
	path: entry.path.slice(1),
	errorElement: <PortalRouteError />,
	element: (
		<CatalogEntryProvider entry={entry}>
			{suspense(entry.page())}
		</CatalogEntryProvider>
	),
}));

export const portalRouter = createBrowserRouter([
	{
		path: "/admin/*",
		errorElement: <PortalRouteError />,
		element: suspense(<AdminPortal />),
	},
	{
		path: "/",
		element: <PortalShell />,
		errorElement: <PortalRouteError />,
		children: [
			...PUBLIC_PAGE_MANIFEST.map(publicPageRoute),
			...entryRoutes,
			{ path: "*", element: <NotFoundPage /> },
		],
	},
]);
