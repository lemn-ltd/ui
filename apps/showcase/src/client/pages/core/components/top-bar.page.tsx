import { ComponentPage, ExampleBlock, PropsTable } from '@appranks/showcase-kit';
import { Breadcrumb, Button, Icon, IconButton, TopBar } from '@appranks/ui';
import { type ReactElement, useState } from 'react';
import { shortTrail } from '../../../fixtures';

function TopBarPage(): ReactElement {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <ComponentPage
      status="stable"
      summary="The screen header. A sidebar toggle and breadcrumb sit on the left and actions on the right; every slot is optional."
      title="Top bar"
    >
      <ExampleBlock
        code={`<TopBar
  onToggleSidebar={() => setCollapsed((c) => !c)}
  sidebarMode={collapsed ? 'hidden' : 'expanded'}
  breadcrumb={<Breadcrumb items={shortTrail} />}
  actions={<Button variant="primary">New</Button>}
/>`}
        render={() => (
          <div style={{ width: '100%' }}>
            <TopBar
              actions={
                <>
                  <IconButton aria-label="Search" variant="ghost">
                    <Icon name="search" size={16} />
                  </IconButton>
                  <Button variant="primary">New</Button>
                </>
              }
              breadcrumb={<Breadcrumb items={shortTrail} />}
              onToggleSidebar={() => setCollapsed((value) => !value)}
              sidebarMode={collapsed ? 'hidden' : 'expanded'}
            />
          </div>
        )}
      />

      <ExampleBlock
        code={`<TopBar breadcrumb={<Breadcrumb items={shortTrail} />} />`}
        render={() => (
          <div style={{ width: '100%' }}>
            <TopBar breadcrumb={<Breadcrumb items={shortTrail} />} />
          </div>
        )}
      />

      <PropsTable
        rows={[
          {
            name: 'breadcrumb',
            type: 'ReactNode',
            description: 'Left slot, after the optional sidebar toggle.',
          },
          {
            name: 'actions',
            type: 'ReactNode',
            description: 'Right slot for buttons and controls.',
          },
          {
            name: 'sidebarMode',
            type: "'expanded' | 'rail' | 'hidden'",
            description:
              'Drives the toggle glyph and aria-label; on desktop the toggle cycles expanded → rail → hidden. Falls back to the enclosing shell.',
          },
          {
            name: 'onToggleSidebar',
            type: '() => void',
            description: 'Sidebar toggle handler; the toggle renders only when set.',
          },
        ]}
      />
    </ComponentPage>
  );
}

export default TopBarPage;
