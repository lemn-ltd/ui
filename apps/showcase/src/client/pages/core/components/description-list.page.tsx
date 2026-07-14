import { ComponentPage, ExampleBlock, PropsTable } from '@lemn-ltd/showcase-kit';
import { Badge, DescriptionList, DescriptionRow, Icon, IconButton, RelativeTime } from '@lemn-ltd/ui';
import type { ReactElement } from 'react';

function DescriptionListPage(): ReactElement {
  return (
    <ComponentPage
      status="stable"
      summary="Label/value detail rows with first-line baseline alignment that inline controls cannot break. For detail panels and dialogs."
      title="Description list"
    >
      <ExampleBlock
        code={`<DescriptionList>
  <DescriptionRow label="Connector URL">
    <span>https://mcp.example/sse</span>
    <IconButton aria-label="Copy URL" variant="ghost">
      <Icon name="copy" size={16} />
    </IconButton>
  </DescriptionRow>
  <DescriptionRow label="Auth">OAuth</DescriptionRow>
  <DescriptionRow label="Scopes">
    <Badge tone="info">channels:read</Badge>
    <Badge tone="info">chat:write</Badge>
  </DescriptionRow>
  <DescriptionRow label="Updated">
    <RelativeTime value={updatedAt} />
  </DescriptionRow>
</DescriptionList>`}
        render={() => (
          <DescriptionList>
            <DescriptionRow label="Connector URL">
              <span>https://mcp.example/sse</span>
              <IconButton aria-label="Copy URL" variant="ghost">
                <Icon name="copy" size={16} />
              </IconButton>
            </DescriptionRow>
            <DescriptionRow label="Auth">OAuth</DescriptionRow>
            <DescriptionRow label="Scopes">
              <Badge tone="info">channels:read</Badge>
              <Badge tone="info">chat:write</Badge>
            </DescriptionRow>
            <DescriptionRow label="Updated">
              <RelativeTime now={Date.now()} value={new Date(Date.now() - 86_400_000)} />
            </DescriptionRow>
          </DescriptionList>
        )}
      />

      <PropsTable
        rows={[
          {
            name: 'label',
            type: 'ReactNode',
            description: 'Row label, shown in the fixed-width left column (DescriptionRow).',
          },
          {
            name: 'children',
            type: 'ReactNode',
            description:
              'The value content. Lead with text; trailing inline controls keep the baseline.',
          },
          {
            name: '…rest',
            type: 'HTMLAttributes',
            description: 'Native props spread onto the dl (list) or row wrapper.',
          },
        ]}
      />
    </ComponentPage>
  );
}

export default DescriptionListPage;
