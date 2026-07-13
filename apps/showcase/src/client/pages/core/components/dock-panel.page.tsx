import { ComponentPage, ExampleBlock, PropsTable } from '@appranks/showcase-kit';
import { DockPanel, type DockTab, Icon, type IconName } from '@lemn-ltd/ui';
import type { CSSProperties, ReactElement } from 'react';

// DockPanel fills its container (height: 100%); a fixed-height grid frame caps
// the shell-scale panel so it reads as a preview rather than taking over the page.
const FRAME: CSSProperties = {
  width: 520,
  height: 420,
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-lg)',
  overflow: 'hidden',
  display: 'grid',
};

const PANE: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 'var(--space-3)',
  height: '100%',
  padding: 'var(--space-6)',
  textAlign: 'center',
};

function Pane({
  icon,
  title,
  description,
}: {
  readonly icon: IconName;
  readonly title: string;
  readonly description: string;
}): ReactElement {
  return (
    <div style={PANE}>
      <Icon name={icon} size={32} />
      <strong style={{ color: 'var(--text)', fontSize: 'var(--font-size-heading)' }}>
        {title}
      </strong>
      <span
        style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-small)', maxWidth: 240 }}
      >
        {description}
      </span>
    </div>
  );
}

const DOCK_TABS: readonly DockTab[] = [
  {
    id: 'preview',
    label: 'Preview',
    icon: 'monitor',
    content: (
      <Pane
        description="Run a build to see the live preview here."
        icon="monitor"
        title="No preview yet"
      />
    ),
  },
  {
    id: 'code',
    label: 'Code',
    icon: 'code',
    content: (
      <Pane
        description="Edits to the workspace show up here."
        icon="code"
        title="No code changes yet"
      />
    ),
  },
  {
    id: 'files',
    label: 'Files',
    icon: 'file-text',
    content: (
      <Pane
        description="Generated files will be listed here."
        icon="file-text"
        title="No files yet"
      />
    ),
  },
];

function DockPanelPage(): ReactElement {
  return (
    <ComponentPage
      status="stable"
      summary="The right-docked workspace panel: a tabbed header with maximize and hide controls over the active tab's body. It fills a ScreenShell's rightPanel slot, and its mode, active tab, and split width live in that enclosing shell — so the panel and the content area resize as one app shell. Shown standalone here to display its chrome."
      title="Dock panel"
    >
      <ExampleBlock
        code={`const tabs = [
  { id: 'preview', label: 'Preview', icon: 'monitor', content: <Preview /> },
  { id: 'code', label: 'Code', icon: 'code', content: <Code /> },
  { id: 'files', label: 'Files', icon: 'file-text', content: <Files /> },
];

// Driven by the enclosing ScreenShell:
<ScreenShell rightPanel={<DockPanel tabs={tabs} />} defaultDockMode="partial" sidebar={sidebar}>
  {content}
</ScreenShell>`}
        render={() => (
          <div style={FRAME}>
            <DockPanel tabs={DOCK_TABS} />
          </div>
        )}
      />

      <PropsTable
        rows={[
          {
            name: 'tabs',
            type: 'readonly DockTab[]',
            description:
              'The panel tabs. Each DockTab has an id, a label, an icon (IconName), and content (ReactNode). The active tab, mode, and split are read from the enclosing ScreenShell.',
          },
        ]}
      />
    </ComponentPage>
  );
}

export default DockPanelPage;
