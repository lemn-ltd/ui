import { ShowcaseEntryProvider } from "@lemn-ltd/showcase-kit";
import { Button } from "@lemn-ltd/ui";
import { lazy, type ReactElement, Suspense } from "react";
import {
	createBrowserRouter,
	isRouteErrorResponse,
	useRouteError,
} from "react-router-dom";
import { pathFor, SHOWCASE_REGISTRY } from "../registry/showcase-registry";
import { NotFoundPage } from "../shell/not-found-page";
import { OverviewPage } from "../shell/overview-page";
import { ShowcaseShell } from "../shell/showcase-shell";

const BrandStudioPage = lazy(
	() => import("../pages/ecosystem/brand-studio.page").then((module) => ({ default: module.PublicBrandStudioPage })),
);
const BlocksPage = lazy(
	() => import("../pages/ecosystem/blocks.page").then((module) => ({ default: module.BlocksPage })),
);
const CatalogPage = lazy(
	() => import("../pages/ecosystem/catalog.page").then((module) => ({ default: module.StableCatalogPage })),
);
const ProvidersPage = lazy(
	() => import("../pages/ecosystem/providers.page").then((module) => ({ default: module.ProvidersPage })),
);

function PageFallback(): ReactElement {
	return <div className="showcase-page-fallback" role="status">Loading…</div>;
}

function RouteError(): ReactElement {
	const error = useRouteError();
	const detail = isRouteErrorResponse(error)
		? `${error.status} ${error.statusText}`
		: error instanceof Error
			? error.message
			: "Unknown route error";
	return (
		<section className="showcase-route-error" role="alert">
			<h1>Page unavailable</h1>
			<p>{detail}</p>
			<Button onClick={() => window.location.reload()} variant="outline">Reload page</Button>
		</section>
	);
}

const entryRoutes = SHOWCASE_REGISTRY.map((entry) => ({
	path: pathFor(entry).slice(1),
	errorElement: <RouteError />,
	element: (
		<ShowcaseEntryProvider entry={entry}>
			<Suspense fallback={<PageFallback />}>{entry.page()}</Suspense>
		</ShowcaseEntryProvider>
	),
}));

function ecosystemRoute(path: string, element: ReactElement) {
	return {
		path: path.slice(1),
		errorElement: <RouteError />,
		element: <Suspense fallback={<PageFallback />}>{element}</Suspense>,
	};
}

export const showcaseRouter = createBrowserRouter([
	{
		path: "/",
		element: <ShowcaseShell />,
		errorElement: <RouteError />,
		children: [
			{ index: true, element: <OverviewPage /> },
			ecosystemRoute("/catalog", <CatalogPage />),
			ecosystemRoute("/providers", <ProvidersPage />),
			ecosystemRoute("/blocks", <BlocksPage />),
			ecosystemRoute("/brand-studio", <BrandStudioPage />),
			...entryRoutes,
			{ path: "*", element: <NotFoundPage /> },
		],
	},
]);
