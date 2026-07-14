import { Button } from "@lemn-ltd/ui";
import type { ComponentType, ReactElement } from "react";
import { Suspense } from "react";
import {
	createBrowserRouter,
	isRouteErrorResponse,
	type RouteObject,
	useRouteError,
} from "react-router-dom";
import { ShowcaseEntryProvider } from "../registry/entry-context.js";
import { pathFor, type ShowcaseEntry } from "../registry/showcase-types.js";

export interface BuildShowcaseRouterOptions<TGroup extends string = string> {
	readonly registry: readonly ShowcaseEntry<TGroup>[];
	readonly shell: ComponentType;
	readonly overview: ComponentType;
	readonly notFound: ComponentType;
	readonly fallback?: ReactElement;
}

function DefaultPageFallback(): ReactElement {
	return (
		<div
			aria-live="polite"
			className="showcase-page-fallback"
			data-showcase-route-state="loading"
			role="status"
		>
			Loading...
		</div>
	);
}

function routeErrorDetail(error: unknown): string {
	if (isRouteErrorResponse(error)) {
		return `${error.status} ${error.statusText}`.trim();
	}
	if (error instanceof Error) return error.message;
	return "Unknown route error";
}

function DefaultRouteError(): ReactElement {
	const error = useRouteError();
	return (
		<section
			className="showcase-route-error"
			data-showcase-route-state="error"
			role="alert"
		>
			<h1>Page unavailable</h1>
			<p>The showcase could not render this route.</p>
			<p className="showcase-route-error__detail">{routeErrorDetail(error)}</p>
			<Button onClick={() => window.location.reload()} variant="outline">
				Reload page
			</Button>
		</section>
	);
}

export function buildShowcaseRouter<TGroup extends string>({
	fallback = <DefaultPageFallback />,
	notFound: NotFoundPage,
	overview: OverviewPage,
	registry,
	shell: ShowcaseShell,
}: BuildShowcaseRouterOptions<TGroup>): ReturnType<typeof createBrowserRouter> {
	const entryRoutes: RouteObject[] = registry.map((entry) => ({
		path: pathFor(entry).slice(1),
		errorElement: <DefaultRouteError />,
		element: (
			<ShowcaseEntryProvider entry={entry}>
				<Suspense fallback={fallback}>{entry.page()}</Suspense>
			</ShowcaseEntryProvider>
		),
	}));

	return createBrowserRouter([
		{
			path: "/",
			element: <ShowcaseShell />,
			errorElement: <DefaultRouteError />,
			children: [
				{ index: true, element: <OverviewPage /> },
				...entryRoutes,
				{ path: "*", element: <NotFoundPage /> },
			],
		},
	]);
}
