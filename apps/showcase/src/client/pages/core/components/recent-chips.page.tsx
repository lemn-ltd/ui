import { ComponentPage, ExampleBlock, PropsTable } from '@lemn-ltd/showcase-kit';
import { RecentChips } from '@lemn-ltd/ui';
import type { ReactElement } from 'react';

const ITEMS = [
  { id: 'recent-01', label: 'Quarterly report' },
  { id: 'recent-02', label: 'Onboarding checklist' },
  { id: 'recent-03', label: 'Release notes' },
  { id: 'recent-04', label: 'Access policy' },
  { id: 'recent-05', label: 'Roadmap' },
] as const;

function RecentChipsPage(): ReactElement {
  return (
    <ComponentPage
      status="stable"
      summary="A leading label followed by a row of muted Tag chips for recent items. When onSelect is set, each chip becomes clickable."
      title="Recent chips"
    >
      <ExampleBlock
        code={`<RecentChips
  label="Recent"
  items={[
    { id: 'recent-01', label: 'Quarterly report' },
    { id: 'recent-02', label: 'Onboarding checklist' },
  ]}
  onSelect={(id) => open(id)}
/>`}
        render={() => <RecentChips items={ITEMS} label="Recent" onSelect={() => undefined} />}
      />

      <ExampleBlock
        code={`<RecentChips label="Recent" items={items} />`}
        render={() => <RecentChips items={ITEMS} label="Recent" />}
      />

      <PropsTable
        rows={[
          {
            name: 'label',
            type: 'ReactNode',
            description: 'Leading caption shown before the chips.',
          },
          {
            name: 'items',
            type: 'readonly RecentChipItem[]',
            description: 'Recent entries, each with an id and a label.',
          },
          {
            name: 'onSelect',
            type: '(id: string) => void',
            description: 'When set, chips become clickable and report the selected id.',
          },
          {
            name: '…rest',
            type: "Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'onSelect'>",
            description: 'Native div props spread onto the root.',
          },
        ]}
      />
    </ComponentPage>
  );
}

export default RecentChipsPage;
