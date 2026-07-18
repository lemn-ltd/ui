import { ContentLayout } from "@lemn-ltd/ui";
import { Children, type ReactElement, type ReactNode } from "react";
import {
	PortalPreviewCanvas,
	useCatalogRenderMode,
} from "../preview/render-mode.js";

export interface FoundationPageProps {
	readonly title: string;
	readonly caption: string;
	readonly children: ReactNode;
}

/**
 * Shared foundation-page chrome. In card/playground render modes it exposes
 * the first canonical token group as the live preview, matching ComponentPage.
 */
export function FoundationPage({
	title,
	caption,
	children,
}: FoundationPageProps): ReactElement {
	const mode = useCatalogRenderMode();

	if (mode !== "page") {
		return (
			<PortalPreviewCanvas>{Children.toArray(children)[0]}</PortalPreviewCanvas>
		);
	}

	return (
		<ContentLayout>
			<section className="ui-page-section">
				<header className="ui-page-section__header">
					<div className="ui-page-section__heading">
						<h1 className="ui-page-section__title">{title}</h1>
						<p className="ui-page-section__caption">{caption}</p>
					</div>
				</header>
				<div className="ui-page-section__body">{children}</div>
			</section>
		</ContentLayout>
	);
}
