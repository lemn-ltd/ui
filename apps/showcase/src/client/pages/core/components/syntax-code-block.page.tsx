import { ComponentPage, ExampleBlock, PropsTable, VariantsGallery } from '@lemn-ltd/showcase-kit';
import { SyntaxCodeBlock } from '@lemn-ltd/ui';
import type { ReactElement } from 'react';

const BASH_SAMPLE = `export API_BASE="https://api.example.com"
export TOKEN="eyJ..."

curl -sS "$API_BASE/v1/sessions" \\
  -H "authorization: Bearer $TOKEN" \\
  -H "content-type: application/json" \\
  -d '{"agentDefinitionId":"agent.implementer"}'`;

const TYPESCRIPT_SAMPLE = `export function summarizeSession(session: RuntimeSession): string {
  return session.attempts.every((attempt) => attempt.status === "completed")
    ? "Ready for review"
    : "Still running";
}`;

const JSON_SAMPLE = `{
  "idempotencyKey": "session-create-001",
  "agentDefinitionId": "agent.implementer",
  "attributes": {
    "delivery": ["stream"],
    "attendance": "unattended"
  }
}`;

function SyntaxCodeBlockPage(): ReactElement {
  return (
    <ComponentPage
      status="beta"
      summary="Copyable multi-line code snippet with lazy dual-theme syntax highlighting for common programming and configuration languages. The copy action is a compact top-right icon, and constrained surfaces can opt into wrapping."
      title="Syntax code block"
    >
      <ExampleBlock
        code={`<SyntaxCodeBlock
  language="bash"
  value={quickstart}
  wrap
/>`}
        render={() => <SyntaxCodeBlock language="bash" value={BASH_SAMPLE} wrap />}
      />

      <VariantsGallery
        columns={1}
        items={[
          {
            label: 'TypeScript',
            render: () => <SyntaxCodeBlock language="typescript" value={TYPESCRIPT_SAMPLE} />,
          },
          {
            label: 'JSON',
            render: () => <SyntaxCodeBlock language="json" value={JSON_SAMPLE} />,
          },
        ]}
      />

      <PropsTable
        rows={[
          {
            name: 'value',
            type: 'string',
            description: 'The code shown and copied to the clipboard.',
          },
          {
            name: 'language',
            type: 'string',
            description:
              'Language tag for highlighting. Supports common aliases such as sh, shell, js, ts, py, yml.',
          },
          {
            name: 'wrap',
            type: 'boolean',
            defaultValue: 'false',
            description: 'Wraps long lines instead of creating horizontal overflow.',
          },
          {
            name: 'className',
            type: 'string',
            description: 'Extra class names appended to the root.',
          },
        ]}
      />
    </ComponentPage>
  );
}

export default SyntaxCodeBlockPage;
