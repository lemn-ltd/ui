import { ComponentPage, ExampleBlock, PropsTable, VariantsGallery } from '@appranks/showcase-kit';
import { MenuItem, OrgSwitcher, type OrgSwitcherVariant } from '@appranks/ui';
import { type ReactElement, useState } from 'react';
import { currentOrgId, orgs } from '../../../fixtures';

const VARIANTS: readonly OrgSwitcherVariant[] = ['expanded', 'rail'];

function OrgSwitcherPage(): ReactElement {
  const [selected, setSelected] = useState(currentOrgId);

  return (
    <ComponentPage
      status="stable"
      summary="A menu-backed organization picker. The expanded variant shows the org name and a chevron; the rail variant shows only the mark. A footer slot hangs below the org list."
      title="Org switcher"
    >
      <ExampleBlock
        code={`const [selected, setSelected] = useState('org-01');

<OrgSwitcher
  orgs={orgs}
  currentOrgId={selected}
  onSelectOrg={setSelected}
  activeOrgAction={{
    label: 'Open org settings',
    icon: 'settings',
    onSelect: openSettings,
  }}
  footer={<MenuItem icon="settings">Manage organizations</MenuItem>}
/>`}
        render={() => (
          <OrgSwitcher
            activeOrgAction={{
              label: 'Open org settings',
              icon: 'settings',
              onSelect: () => undefined,
            }}
            currentOrgId={selected}
            footer={<MenuItem icon="settings">Manage organizations</MenuItem>}
            onSelectOrg={setSelected}
            orgs={orgs}
            variant="expanded"
          />
        )}
      />

      <VariantsGallery
        items={VARIANTS.map((variant) => ({
          label: variant,
          render: () => <OrgSwitcher currentOrgId={currentOrgId} orgs={orgs} variant={variant} />,
        }))}
      />

      <PropsTable
        rows={[
          {
            name: 'orgs',
            type: 'readonly OrgItem[]',
            description: 'Organizations to list. Each has an id, a name, and an optional mark.',
          },
          {
            name: 'currentOrgId',
            type: 'string',
            description: 'Id of the active org; its mark and name fill the trigger.',
          },
          {
            name: 'variant',
            type: "'expanded' | 'rail'",
            defaultValue: "'expanded'",
            description: 'Expanded shows the name and chevron; rail shows only the mark.',
          },
          {
            name: 'onSelectOrg',
            type: '(id: string) => void',
            description: 'Fires with the chosen org id from the menu.',
          },
          {
            name: 'activeOrgAction',
            type: '{ label; icon?; onSelect }',
            description:
              'Optional action shown inside the selected org row (e.g. open org settings).',
          },
          {
            name: 'footer',
            type: 'ReactNode',
            description: 'Optional node below a separator at the foot of the menu.',
          },
        ]}
      />
    </ComponentPage>
  );
}

export default OrgSwitcherPage;
