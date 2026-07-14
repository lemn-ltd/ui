import { ContentLayout, Icon } from "@lemn-ltd/ui";
import type { ReactElement } from "react";
import { Link } from "react-router-dom";
import { uiShowcaseAppDescriptor } from "../../app-descriptor";
import { HOME_FEATURES } from "./home-features.js";
import {
	navGroups,
	pathFor,
	SHOWCASE_REGISTRY,
} from "../registry/showcase-registry.js";

export function OverviewPage(): ReactElement {
	const catalogGroups = navGroups();
	const componentCount = SHOWCASE_REGISTRY.filter(
		(entry) => entry.kind === "component",
	).length;
	const patternCount = SHOWCASE_REGISTRY.filter(
		(entry) => entry.kind === "pattern",
	).length;

	return (
		<ContentLayout className="showcase-home">
			<header className="showcase-home__hero">
				<span className="showcase-home__eyebrow">
					{uiShowcaseAppDescriptor.displayName}
				</span>
				<h1>Build product surfaces that explain themselves.</h1>
				<p>
					A live catalog for reports, operational workflows, agent experiences,
					and the interaction patterns that connect them.
				</p>
				<div className="showcase-home__hero-actions">
					<Link
						className="showcase-home__cta"
						data-variant="primary"
						to="/core/components/button"
					>
						Explore components
						<Icon name="arrow-right" size={16} />
					</Link>
					<Link
						className="showcase-home__cta"
						data-variant="secondary"
						to="/core/patterns/dashboard"
					>
						Explore patterns
					</Link>
				</div>
				<dl className="showcase-home__hero-stats">
					<div>
						<dt>Components</dt>
						<dd>{componentCount}</dd>
					</div>
					<div>
						<dt>Patterns</dt>
						<dd>{patternCount}</dd>
					</div>
					<div>
						<dt>Curated capabilities</dt>
						<dd>{HOME_FEATURES.length}</dd>
					</div>
				</dl>
			</header>

			<section
				aria-labelledby="home-capabilities-title"
				className="showcase-home__capabilities"
			>
				<div className="showcase-home__section-heading">
					<span>Composed from the catalog</span>
					<h2 id="home-capabilities-title">
						Real components, ready to interact with.
					</h2>
					<p>
						Each composition runs at natural size with local, deterministic
						state. Use the controls here, then open the detailed component pages
						for implementation guidance.
					</p>
				</div>

				<div className="showcase-home__bento">
					{HOME_FEATURES.map((feature) => {
						const primaryEntry = SHOWCASE_REGISTRY.find(
							(entry) => entry.slug === feature.componentSlugs[0],
						);
						if (!primaryEntry) return null;
						const FeaturePreview = feature.render;

						return (
							<article
								className="showcase-home-feature"
								data-home-feature={feature.id}
								data-layout={feature.layout}
								key={feature.id}
							>
								<header className="showcase-home-feature__header">
									<div>
										<h3>{feature.title}</h3>
										<p>{feature.description}</p>
									</div>
									<Link
										className="showcase-home-feature__link"
										to={pathFor(primaryEntry)}
									>
										View components
										<Icon name="arrow-right" size={14} />
									</Link>
								</header>
								<div className="showcase-home-feature__canvas">
									<FeaturePreview />
								</div>
							</article>
						);
					})}
				</div>
			</section>

			<section
				aria-labelledby="home-catalog-title"
				className="showcase-home__catalog"
			>
				<div className="showcase-home__section-heading">
					<span>Everything else stays discoverable</span>
					<h2 id="home-catalog-title">Browse the complete catalog</h2>
					<p>
						The homepage remains intentionally curated while navigation and
						search scale with every component added to Core and Agents.
					</p>
				</div>
				<ul className="showcase-home__catalog-grid">
					{catalogGroups.map((group) => {
						const firstEntry = group.entries[0];
						if (!firstEntry) return null;
						return (
							<li key={group.group}>
								<Link to={pathFor(firstEntry)}>
									<span>{group.group}</span>
									<strong>{group.entries.length}</strong>
									<Icon name="arrow-right" size={14} />
								</Link>
							</li>
						);
					})}
				</ul>
			</section>
		</ContentLayout>
	);
}
