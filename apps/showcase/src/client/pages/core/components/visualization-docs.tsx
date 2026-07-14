import {
  DocumentationFooter,
  DocumentationPage,
  DocumentationSection,
  DocumentationSteps,
  ExampleBlock,
  type DocumentationApiRow,
} from '@lemn-ltd/showcase-kit';
import { SyntaxCodeBlock } from '@lemn-ltd/ui';
import type { ReactElement, ReactNode } from 'react';

export const VISUALIZATION_PREVIEW_STYLE = { width: 'min(720px, 100%)' } as const;

interface VisualizationDocsProps {
  readonly apiRows: readonly DocumentationApiRow[];
  readonly children?: ReactNode;
  readonly code: string;
  readonly componentName: string;
  readonly render: () => ReactElement;
  readonly summary: string;
  readonly title: string;
}

export function VisualizationDocs({
  apiRows,
  children,
  code,
  componentName,
  render,
  summary,
  title,
}: VisualizationDocsProps): ReactElement {
  return (
    <DocumentationPage
      category="Visualizations"
      resources={[{ href: 'https://github.com/lemn-ltd/ui', label: 'GitHub' }]}
      summary={summary}
      title={title}
    >
      <ExampleBlock code={code} presentation="documentation" render={render} />

      <DocumentationSection title="Installation">
        <DocumentationSteps
          steps={[
            {
              title: 'Install the package:',
              content: <SyntaxCodeBlock language="bash" value="pnpm add @lemn-ltd/ui" />,
            },
            {
              title: 'Load the component:',
              description: (
                <p>Import the shared stylesheet once at the application root, then use the public package entrypoint.</p>
              ),
              content: (
                <SyntaxCodeBlock
                  language="tsx"
                  value={`import '@lemn-ltd/ui/styles.css';\nimport { ${componentName} } from '@lemn-ltd/ui';`}
                />
              ),
            },
          ]}
        />
      </DocumentationSection>

      {children}

      <DocumentationFooter
        apiHref="https://github.com/lemn-ltd/ui/tree/main/packages/ui/src/visualizations"
        apiLabel="Source"
        apiRows={[...apiRows]}
        componentName={title}
        copyright="2026 LEMN. All rights reserved."
        issueHref="https://github.com/lemn-ltd/ui/issues/new"
      />
    </DocumentationPage>
  );
}
