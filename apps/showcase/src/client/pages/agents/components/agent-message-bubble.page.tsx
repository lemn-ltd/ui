import { ComponentPage, ExampleBlock, PropsTable } from '@appranks/showcase-kit';
import { AgentMessageBubble, Badge, Card, CodeBlock } from '@appranks/ui';
import type { ReactElement } from 'react';

const NOW = Date.parse('2026-06-11T12:25:00.000Z');
const CREATED_AT = '2026-06-11T12:21:00.000Z';

function AgentMessageBubblePage(): ReactElement {
  return (
    <ComponentPage
      status="beta"
      summary="A full-width transparent assistant response bubble for agent conversations, with copy and optional relative timestamp metadata."
      title="Agent message bubble"
    >
      <ExampleBlock
        code={`<AgentMessageBubble
  content="I checked the workspace and found the route owner."
  createdAt="2026-06-11T12:21:00.000Z"
/>`}
        render={() => (
          <AgentMessageBubble
            content={[
              'Pregunta correcta: merece verificacion contra el esquema real.',
              '',
              '- Revise el owner del runtime',
              '- Mantengo el cambio en el paquete UI',
              '- El producto solo consume el componente',
            ].join('\n')}
            createdAt={CREATED_AT}
            now={NOW}
          />
        )}
      />

      <ExampleBlock
        code={`<AgentMessageBubble content="I ran the check.">
  <Card>Structured runtime content</Card>
</AgentMessageBubble>`}
        render={() => (
          <AgentMessageBubble content="I ran the check." createdAt={CREATED_AT} now={NOW}>
            <Card
              footer={<CodeBlock value="packages/ui/src/agents/index.ts" variant="token" />}
              title="read_file"
            >
              <Badge tone="success" variant="soft">
                output-available
              </Badge>
            </Card>
          </AgentMessageBubble>
        )}
      />

      <PropsTable
        rows={[
          {
            name: 'content',
            type: 'string',
            description: 'Markdown source rendered as the visible assistant response.',
          },
          {
            name: 'children',
            type: 'ReactNode',
            description: 'Optional structured content below the response, such as tool cards.',
          },
          {
            name: 'copyText',
            type: 'string',
            defaultValue: 'content',
            description: 'Text copied by the footer action.',
          },
          {
            name: 'createdAt',
            type: 'string | number | Date',
            description: 'Optional timestamp rendered through RelativeTime.',
          },
          {
            name: 'now',
            type: 'number',
            description: 'Optional deterministic clock for relative-time rendering.',
          },
        ]}
      />
    </ComponentPage>
  );
}

export default AgentMessageBubblePage;
