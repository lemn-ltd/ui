import type { ComponentType, ReactElement } from "react";
import { Suspense } from "react";
import { createBrowserRouter, type RouteObject } from "react-router-dom";
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
	return <div className="showcase-page-fallback">Loading...</div>;
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
			children: [
				{ index: true, element: <OverviewPage /> },
				...entryRoutes,
				{ path: "*", element: <NotFoundPage /> },
			],
		},
	]);
}
