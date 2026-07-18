import { ContentLayout, Icon } from "@lemn-ltd/ui";
import type { ReactElement } from "react";
import { Link } from "react-router-dom";
import { uiPortalAppDescriptor } from "../../app-descriptor";
import { catalogSectionManifestEntry } from "../../catalog/catalog-manifest.js";
import { CATALOG_REGISTRY, navGroups } from "../registry/catalog-registry.js";
import { HOME_FEATURES } from "./home-features.js";

export function OverviewPage(): ReactElement {
	const catalogGroups = navGroups();
	const componentCount = CATALOG_REGISTRY.filter(
		(entry) => entry.kind === "component",
	).length;
	const patternCount = CATALOG_REGISTRY.filter(
		(entry) => entry.kind === "pattern",
	).length;
	const stableCount = CATALOG_REGISTRY.filter(
		(entry) => entry.kind === "component" && entry.status === "stable",
	).length;
	const blockCount = CATALOG_REGISTRY.filter(
		(entry) => entry.kind === "block",
	).length;
	const componentsSection = catalogSectionManifestEntry("components");
	const patternsSection = catalogSectionManifestEntry("patterns");
	const blocksSection = catalogSectionManifestEntry("blocks");
	const playgroundSection = catalogSectionManifestEntry("playground");

	return (
		<ContentLayout className="portal-home">
			<header className="portal-home__hero">
				<span className="portal-home__eyebrow">
					{uiPortalAppDescriptor.displayName}
				</span>
				<h1>Build product surfaces that explain themselves.</h1>
				<p>
					A live catalog for reports, operational workflows, visualizations, and
					the interaction patterns that connect them.
				</p>
				<div className="portal-home__hero-actions">
					<Link
						className="portal-home__cta"
						data-variant="primary"
						to={componentsSection.path}
					>
						Explore components
						<Icon name="arrow-right" size={16} />
					</Link>
					<Link
						className="portal-home__cta"
						data-variant="secondary"
						to={patternsSection.path}
					>
						Explore patterns
					</Link>
					<Link className="portal-home__cta" to={blocksSection.path}>
						Explore blocks
					</Link>
					<Link className="portal-home__cta" to={playgroundSection.path}>
						Open Playground
					</Link>
				</div>
				<dl className="portal-home__hero-stats">
					<div>
						<dt>Components</dt>
						<dd>{componentCount}</dd>
					</div>
					<div>
						<dt>Patterns</dt>
						<dd>{patternCount}</dd>
					</div>
					<div>
						<dt>Stable capabilities</dt>
						<dd>{stableCount}</dd>
					</div>
					<div>
						<dt>Curated blocks</dt>
						<dd>{blockCount}</dd>
					</div>
				</dl>
			</header>

			<section
				aria-labelledby="home-capabilities-title"
				className="portal-home__capabilities"
			>
				<div className="portal-home__section-heading">
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

				<div className="portal-home__bento">
					{HOME_FEATURES.map((feature) => {
						const primaryEntry = CATALOG_REGISTRY.find(
							(entry) => entry.slug === feature.componentSlugs[0],
						);
						if (!primaryEntry) return null;
						const FeaturePreview = feature.render;

						return (
							<article
								className="portal-home-feature"
								data-home-feature={feature.id}
								data-layout={feature.layout}
								key={feature.id}
							>
								<header className="portal-home-feature__header">
									<div>
										<h3>{feature.title}</h3>
										<p>{feature.description}</p>
									</div>
									<Link
										className="portal-home-feature__link"
										to={primaryEntry.path}
									>
										View components
										<Icon name="arrow-right" size={14} />
									</Link>
								</header>
								<div className="portal-home-feature__canvas">
									<FeaturePreview />
								</div>
							</article>
						);
					})}
				</div>
			</section>

			<section
				aria-labelledby="home-catalog-title"
				className="portal-home__catalog"
			>
				<div className="portal-home__section-heading">
					<span>Everything else stays discoverable</span>
					<h2 id="home-catalog-title">Browse the complete catalog</h2>
					<p>
						The homepage remains intentionally curated while navigation and
						search scale with every component enabled in the Core registry.
					</p>
				</div>
				<ul className="portal-home__catalog-grid">
					{catalogGroups.map((group) => {
						const firstEntry = group.entries[0];
						if (!firstEntry) return null;
						return (
							<li key={group.group}>
								<Link to={firstEntry.path}>
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
