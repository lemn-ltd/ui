import { componentCatalog, ContentLayout } from "@lemn-ltd/ui";
import type { ReactElement } from "react";
import { Link } from "react-router-dom";

export function StableCatalogPage(): ReactElement {
	const stable = componentCatalog.filter((entry) => entry.status === "stable");
	return (
		<ContentLayout className="showcase-ecosystem-page">
			<header className="showcase-ecosystem-page__header">
				<span>Stable catalog</span>
				<h1>{stable.length} supported capabilities</h1>
				<p>Every item has one public LEMN export and a live interactive route.</p>
			</header>
			<ul className="showcase-stable-catalog">
				{stable.map((entry) => (
					<li key={entry.slug}>
						<Link to={`/${entry.area}/components/${entry.slug}`}>
							<strong>{entry.title}</strong>
							<span>{entry.intent}</span>
						</Link>
					</li>
				))}
			</ul>
		</ContentLayout>
	);
}
