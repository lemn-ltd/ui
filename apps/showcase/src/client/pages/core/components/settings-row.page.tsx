import { ComponentPage, ExampleBlock, PropsTable } from '@appranks/showcase-kit';
import { Avatar, Card, SettingsRow } from '@appranks/ui';
import type { ReactElement } from 'react';

function SettingsRowPage(): ReactElement {
  return (
    <ComponentPage
      status="stable"
      summary="A labelled settings row: a title and optional description on the left, a value or control on the right. Stack several inside a Card."
      title="Settings row"
    >
      <ExampleBlock
        code={`<Card>
  <SettingsRow label="Name">
    <span>Avery Quinn</span>
  </SettingsRow>
  <SettingsRow description="Your primary email address" label="Email">
    <span>avery@example.com</span>
  </SettingsRow>
  <SettingsRow label="Profile picture">
    <Avatar size={32}>AV</Avatar>
  </SettingsRow>
</Card>`}
        render={() => (
          <Card>
            <SettingsRow label="Name">
              <span>Avery Quinn</span>
            </SettingsRow>
            <SettingsRow description="Your primary email address" label="Email">
              <span>avery@example.com</span>
            </SettingsRow>
            <SettingsRow label="Profile picture">
              <Avatar size={32}>AV</Avatar>
            </SettingsRow>
          </Card>
        )}
      />

      <PropsTable
        rows={[
          { name: 'label', type: 'ReactNode', description: 'Row title, shown on the left.' },
          {
            name: 'description',
            type: 'ReactNode',
            description: 'Optional muted caption under the label.',
          },
          {
            name: 'children',
            type: 'ReactNode',
            description: 'The value or control, right-aligned.',
          },
          {
            name: '…rest',
            type: "Omit<HTMLAttributes<HTMLDivElement>, 'title'>",
            description: 'Native div props spread onto the root.',
          },
        ]}
      />
    </ComponentPage>
  );
}

export default SettingsRowPage;
