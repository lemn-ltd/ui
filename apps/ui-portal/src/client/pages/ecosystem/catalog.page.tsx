import { ContentLayout } from "@lemn-ltd/ui";
import type { ReactElement } from "react";
import { Link } from "react-router-dom";
import {
	type CatalogSectionId,
	catalogSectionManifestEntry,
} from "../../../catalog/catalog-manifest.js";
import { CATALOG_REGISTRY, pathFor } from "../../registry/catalog-registry";

export function CatalogIndexPage({
	section,
}: {
	readonly section: CatalogSectionId;
}): ReactElement {
	const entries = CATALOG_REGISTRY.filter((entry) => entry.section === section);
	const sectionManifest = catalogSectionManifestEntry(section);
	return (
		<ContentLayout className="portal-ecosystem-page">
			<header className="portal-ecosystem-page__header">
				<span>Lemn UI catalog</span>
				<h1>{sectionManifest.label}</h1>
				<p>{sectionManifest.summary}</p>
			</header>
			{entries.length === 0 ? (
				<div className="portal-empty-state" role="status">
					No entries are enabled for this section.
				</div>
			) : (
				<ul className="portal-stable-catalog">
					{entries.map((entry) => (
						<li key={entry.slug}>
							<Link to={pathFor(entry)}>
								<strong>{entry.title}</strong>
								<span>{entry.summary}</span>
							</Link>
						</li>
					))}
				</ul>
			)}
		</ContentLayout>
	);
}
