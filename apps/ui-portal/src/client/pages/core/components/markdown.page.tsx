import { ComponentPage, ExampleBlock, PropsTable } from '@portal/catalog-kit';
import { Markdown } from '@lemn-ltd/ui';
import type { ReactElement } from 'react';

const DOCUMENT = [
  '# Release notes',
  '',
  'The runtime applies **quality gates** before a change ships. Each gate records',
  'durable evidence — see the [audit guide](https://example.com) or run `make validate`.',
  '',
  '- Provision or reuse a sandbox',
  '- Run the agent runtime against the approved requirement',
  '- Record audit evidence and open the review',
  '',
  '| Gate | Status |',
  '| ---- | ------ |',
  '| Typecheck | Passed |',
  '| E2E evidence | Recorded |',
].join('\n');

const FENCED = [
  '```ts',
  'export function gate(run: Run): boolean {',
  '  return run.checks.every(isOk);',
  '}',
  '```',
].join('\n');

function MarkdownPage(): ReactElement {
  return (
    <ComponentPage
      status="beta"
      summary="Read-only GitHub Flavored Markdown renderer: headings, paragraphs, lists, links, tables, inline code, and fenced code with a language chip, a copy control, and dual-theme syntax highlighting loaded lazily per language. Raw HTML in the source is never rendered."
      title="Markdown"
    >
      <ExampleBlock
        code={`<Markdown content={documentSource} />`}
        render={() => <Markdown content={DOCUMENT} />}
      />

      <ExampleBlock
        code={`<Markdown content={'\`\`\`ts\\nexport function gate(run: Run): boolean {…}\\n\`\`\`'} />`}
        render={() => <Markdown content={FENCED} />}
      />

      <PropsTable
        rows={[
          {
            name: 'content',
            type: 'string',
            description: 'Raw Markdown source. GFM (tables, strikethrough, task lists) is enabled.',
          },
          {
            name: 'className',
            type: 'string',
            description: 'Extra class merged onto the root, for per-surface adjustments.',
          },
        ]}
      />
    </ComponentPage>
  );
}

export default MarkdownPage;
