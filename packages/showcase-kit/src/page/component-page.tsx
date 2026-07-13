import {
	Badge,
	componentExportsFromSlug,
	ContentLayout,
	SyntaxCodeBlock,
} from "@lemn-ltd/ui";
import {
	Children,
	cloneElement,
	isValidElement,
	type ReactElement,
	type ReactNode,
} from "react";
import {
	ExampleBlock,
	type ExampleBlockProps,
} from "../example/example-block.js";
import { PropsTable, type PropsTableProps } from "../example/props-table.js";
import {
	ShowcasePreviewCanvas,
	useShowcaseRenderMode,
} from "../preview/render-mode.js";
import { useShowcaseEntryMeta } from "../registry/entry-context.js";
import {
	DocumentationFooter,
	DocumentationPage,
	DocumentationSection,
	DocumentationSteps,
} from "./documentation-page.js";

export interface ComponentPageProps {
	readonly title: string;
	readonly summary: string;
	readonly status?: "stable" | "beta";
	readonly children: ReactNode;
}

function withPublicImport(
	code: string,
	publicExports: readonly string[],
): string {
	if (code.includes("from '@lemn-ltd/ui'")) return code;
	return `import { ${publicExports.join(", ")} } from '@lemn-ltd/ui';\n\n${code}`;
}

function asDocumentationExample(
	example: ReactElement<ExampleBlockProps>,
	publicExports: readonly string[],
): ReactElement {
	return cloneElement(example, {
		code: withPublicImport(example.props.code, publicExports),
		presentation: "documentation",
	});
}

/**
 * Shared chrome for every component and pattern page: a titled header with an
 * optional status badge, then a vertical stack of examples, galleries, and
 * tables. Foundation pages keep their own token-reference layout.
 */
export function ComponentPage({
	title,
	summary,
	status,
	children,
}: ComponentPageProps): ReactElement {
	const mode = useShowcaseRenderMode();
	const entry = useShowcaseEntryMeta();

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

	if (entry && entry.kind !== "component") {
		return (
			<ContentLayout>
				<div className="showcase-page">
					<header className="showcase-page__header">
						<div className="showcase-page__title-row">
							<h1>{title}</h1>
							{status ? (
								<Badge tone={status === "stable" ? "success" : "warn"}>
									{status}
								</Badge>
							) : null}
						</div>
						<p className="showcase-page__summary">{summary}</p>
					</header>
					<div className="showcase-stack">{children}</div>
				</div>
			</ContentLayout>
		);
	}

	const pageChildren = Children.toArray(children);
	const examples = pageChildren.filter(
		(child): child is ReactElement<ExampleBlockProps> =>
			isValidElement<ExampleBlockProps>(child) && child.type === ExampleBlock,
	);
	const propsTable = pageChildren.find(
		(child): child is ReactElement<PropsTableProps> =>
			isValidElement<PropsTableProps>(child) && child.type === PropsTable,
	);
	const supplemental = pageChildren.filter(
		(child) =>
			!(
				isValidElement(child) &&
				(child.type === ExampleBlock || child.type === PropsTable)
			),
	);

	const hero = examples[0];
	if (!hero) {
		throw new Error(
			`${entry?.slug ?? title} must define a canonical ExampleBlock.`,
		);
	}
	if (!propsTable) {
		throw new Error(`${entry?.slug ?? title} must define a PropsTable.`);
	}

	const slug = entry?.slug ?? title.toLowerCase().replaceAll(" ", "-");
	const publicExports = componentExportsFromSlug(slug);
	const importStatement = `import '@lemn-ltd/ui/styles.css';\nimport { ${publicExports.join(
		", ",
	)} } from '@lemn-ltd/ui';`;

	return (
		<DocumentationPage
			category={entry?.group ?? "Components"}
			resources={[{ href: "https://github.com/lemn-ltd/ui", label: "GitHub" }]}
			status={entry?.status ?? status}
			summary={entry?.summary ?? summary}
			title={entry?.title ?? title}
		>
			{asDocumentationExample(hero, publicExports)}

			<DocumentationSection title="Installation">
				<DocumentationSteps
					steps={[
						{
							title: "Install the package:",
							content: (
								<SyntaxCodeBlock
									language="bash"
									value="pnpm add @lemn-ltd/ui"
								/>
							),
						},
						{
							title: "Load the component:",
							description: (
								<p>
									Import the shared stylesheet once at the application root,
									then import the component from the public package entrypoint.
								</p>
							),
							content: (
								<SyntaxCodeBlock language="tsx" value={importStatement} />
							),
						},
					]}
				/>
			</DocumentationSection>

			{examples.slice(1).map((example, index) => (
				<DocumentationSection
					key={`example-${index + 2}`}
					title={
						index === 0
							? "Example: Additional behavior"
							: "Example: Advanced behavior"
					}
				>
					{asDocumentationExample(example, publicExports)}
				</DocumentationSection>
			))}

			{supplemental.length > 0 ? (
				<DocumentationSection title="Variants and states">
					<div className="showcase-docs-supplemental">{supplemental}</div>
				</DocumentationSection>
			) : null}

			<DocumentationFooter
				apiHref="https://github.com/lemn-ltd/ui"
				apiLabel="LEMN UI API"
				apiRows={propsTable.props.rows.map((row) => ({
					defaultValue: row.defaultValue,
					description: row.description,
					prop: row.name,
					type: row.type,
				}))}
				componentName={entry?.title ?? title}
				copyright="2026 LEMN. All rights reserved."
				issueHref="https://github.com/lemn-ltd/ui/issues/new"
			/>
		</DocumentationPage>
	);
}
