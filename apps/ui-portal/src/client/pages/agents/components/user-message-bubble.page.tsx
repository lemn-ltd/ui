import { ComponentPage, ExampleBlock, PropsTable } from '@portal/catalog-kit';
import { UserMessageBubble } from '@lemn-ltd/ui';
import type { ReactElement } from 'react';

const NOW = Date.parse('2026-06-11T12:25:00.000Z');
const CREATED_AT = '2026-06-11T12:21:00.000Z';

function UserMessageBubblePage(): ReactElement {
  return (
    <ComponentPage
      status="beta"
      summary="A right-aligned operator message bubble for agent conversations, using the accent surface plus copy and optional relative timestamp metadata."
      title="User message bubble"
    >
      <ExampleBlock
        code={`<UserMessageBubble
  content="Migremos primero las burbujas de chat."
  createdAt="2026-06-11T12:21:00.000Z"
/>`}
        render={() => (
          <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
            <UserMessageBubble
              content="Migremos primero las burbujas de chat."
              createdAt={CREATED_AT}
              now={NOW}
            />
          </div>
        )}
      />

      <PropsTable
        rows={[
          {
            name: 'content',
            type: 'string',
            description: 'Plain text rendered inside the operator bubble.',
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

export default UserMessageBubblePage;
