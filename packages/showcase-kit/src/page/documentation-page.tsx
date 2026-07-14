import { Badge, ContentLayout, Icon } from "@lemn-ltd/ui";
import {
	Children,
	isValidElement,
	type ReactElement,
	type ReactNode,
} from "react";
import { ExampleBlock } from "../example/example-block.js";
import {
	ShowcasePreviewCanvas,
	useShowcaseRenderMode,
} from "../preview/render-mode.js";

export interface DocumentationResource {
	readonly href: string;
	readonly label: string;
}

export interface DocumentationPageProps {
	readonly category: string;
	readonly title: string;
	readonly summary: string;
	readonly resources?: readonly DocumentationResource[];
	readonly status?: "stable" | "beta";
	readonly children: ReactNode;
}

export interface DocumentationSectionProps {
	readonly title: string;
	readonly description?: ReactNode;
	readonly children?: ReactNode;
}

export interface DocumentationStep {
	readonly title: string;
	readonly description?: ReactNode;
	readonly content: ReactNode;
}

export interface DocumentationApiRow {
	readonly prop: string;
	readonly type: string;
	readonly defaultValue?: string;
	readonly description: ReactNode;
}

export interface DocumentationStepsProps {
	readonly steps: readonly DocumentationStep[];
}

export interface DocumentationFooterProps {
	readonly apiHref: string;
	readonly apiLabel: string;
	readonly apiRows?: readonly DocumentationApiRow[];
	readonly componentName: string;
	readonly copyright: string;
	readonly issueHref: string;
}

export const MAX_DOCUMENTATION_EXAMPLES = 3;

function countDocumentationExamples(node: ReactNode): number {
	return Children.toArray(node).reduce<number>((count, child) => {
		if (!isValidElement<{ children?: ReactNode }>(child)) return count;

		const ownCount = child.type === ExampleBlock ? 1 : 0;
		return ownCount + count + countDocumentationExamples(child.props.children);
	}, 0);
}

/**
 * Long-form component documentation shell. It keeps the same canonical-example
 * contract as ComponentPage so overview cards and playgrounds still render the
 * real component instead of the documentation chrome.
 */
export function DocumentationPage({
	category,
	title,
	summary,
	resources = [],
	status,
	children,
}: DocumentationPageProps): ReactElement {
	const mode = useShowcaseRenderMode();
	const exampleCount = countDocumentationExamples(children);

	if (exampleCount > MAX_DOCUMENTATION_EXAMPLES) {
		throw new Error(
			`${title} defines ${exampleCount} examples. Documentation pages support at most ${MAX_DOCUMENTATION_EXAMPLES}.`,
		);
	}

	if (mode !== "page") {
		const pageChildren = Children.toArray(children);
		const canonicalExample = pageChildren.find(
			(child) => isValidElement(child) && child.type === ExampleBlock,
		);

		if (canonicalExample && isValidElement(canonicalExample)) {
			return canonicalExample;
		}

		return <ShowcasePreviewCanvas>{pageChildren[0]}</ShowcasePreviewCanvas>;
	}

	return (
		<ContentLayout className="showcase-docs-layout">
			<article className="showcase-docs-page">
				<header className="showcase-docs-page__header">
					<span className="showcase-docs-page__category">{category}</span>
					<div className="showcase-docs-page__title-row">
						<h1>{title}</h1>
						{status ? (
							<Badge tone={status === "stable" ? "success" : "warn"}>
								{status}
							</Badge>
						) : null}
					</div>
					<p className="showcase-docs-page__summary">{summary}</p>
					{resources.length > 0 ? (
						<nav
							aria-label={`${title} resources`}
							className="showcase-docs-page__resources"
						>
							{resources.map((resource) => (
								<a
									aria-label={`${resource.label} (opens in a new tab)`}
									href={resource.href}
									key={resource.href}
									referrerPolicy="no-referrer"
									rel="noreferrer noopener"
									target="_blank"
								>
									{resource.label}
									<Icon name="external-link" size={12} />
								</a>
							))}
						</nav>
					) : null}
				</header>
				<div className="showcase-docs-page__body">{children}</div>
			</article>
		</ContentLayout>
	);
}

export function DocumentationSection({
	title,
	description,
	children,
}: DocumentationSectionProps): ReactElement {
	return (
		<section className="showcase-docs-section">
			<div className="showcase-docs-section__heading">
				<h2>{title}</h2>
				{description ? (
					<div className="showcase-docs-section__description">
						{description}
					</div>
				) : null}
			</div>
			{children}
		</section>
	);
}

export function DocumentationSteps({
	steps,
}: DocumentationStepsProps): ReactElement {
	return (
		<ol className="showcase-docs-steps">
			{steps.map((step, index) => (
				<li
					className="showcase-docs-steps__item"
					key={`${index}-${step.title}`}
				>
					<span aria-hidden="true" className="showcase-docs-steps__number">
						{index + 1}
					</span>
					<div className="showcase-docs-steps__content">
						<h3>{step.title}</h3>
						{step.description ? (
							<div className="showcase-docs-steps__description">
								{step.description}
							</div>
						) : null}
						{step.content}
					</div>
				</li>
			))}
		</ol>
	);
}

/** Shared legal and support close for component reference pages. */
export function DocumentationFooter({
	apiHref,
	apiLabel,
	apiRows = [],
	componentName,
	copyright,
	issueHref,
}: DocumentationFooterProps): ReactElement {
	return (
		<footer className="showcase-docs-footer">
			<div className="showcase-docs-footer__api">
				<h2>API Reference: {componentName}</h2>
				<p>
					This component uses the{" "}
					<a
						aria-label={`${apiLabel} (opens in a new tab)`}
						href={apiHref}
						referrerPolicy="no-referrer"
						rel="noreferrer noopener"
						target="_blank"
					>
						{apiLabel}
					</a>
					.
				</p>
				{apiRows.length > 0 ? (
					<div
						aria-label={`${componentName} API properties`}
						className="showcase-docs-api-table-wrap"
						role="region"
						tabIndex={0}
					>
						<table className="showcase-docs-api-table">
							<thead>
								<tr>
									<th scope="col">Prop</th>
									<th scope="col">Type</th>
									<th scope="col">Default</th>
									<th scope="col">Description</th>
								</tr>
							</thead>
							<tbody>
								{apiRows.map((row) => (
									<tr key={row.prop}>
										<th scope="row">
											<code>{row.prop}</code>
										</th>
										<td>
											<code>{row.type}</code>
										</td>
										<td>
											<code>{row.defaultValue ?? "—"}</code>
										</td>
										<td>{row.description}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				) : null}
			</div>
			<p className="showcase-docs-footer__issue">
				Found a bug? Let us know{" "}
				<a
					aria-label="Report a bug (opens in a new tab)"
					href={issueHref}
					referrerPolicy="no-referrer"
					rel="noreferrer noopener"
					target="_blank"
				>
					here
				</a>
				.
			</p>
			<div className="showcase-docs-footer__copyright">© {copyright}</div>
		</footer>
	);
}
