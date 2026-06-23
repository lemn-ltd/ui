import type { ReactElement, ReactNode } from 'react';
import { useShell } from '../../layout/screen-shell/shell-context.js';
import { Icon, IconButton, type IconName } from '../../primitives/index.js';
import './dock-panel.css';

export interface DockTab {
  readonly id: string;
  readonly label: string;
  readonly icon: IconName;
  readonly content: ReactNode;
}

export interface DockPanelProps {
  readonly tabs: readonly DockTab[];
}

/**
 * Right-docked workspace panel: a tab header with maximize/hide controls and the
 * active tab's body. Its mode, active tab and split live in the enclosing
 * ScreenShell, so the panel is driven and resized as one app shell.
 */
export function DockPanel({ tabs }: DockPanelProps): ReactElement {
  const dock = useShell()?.dock;
  const activeId = tabs.some((tab) => tab.id === dock?.activeTab) ? dock?.activeTab : tabs[0]?.id;
  const active = tabs.find((tab) => tab.id === activeId) ?? tabs[0];
  const maximized = dock?.mode === 'maximized';

  return (
    <aside aria-label="Workspace panel" className="ui-dock-panel">
      <div className="ui-dock-panel__header">
        <div className="ui-dock-panel__tabs">
          {tabs.map((tab) => (
            <button
              className="ui-dock-panel__tab"
              data-active={tab.id === activeId ? 'true' : 'false'}
              key={tab.id}
              onClick={() => dock?.setActiveTab(tab.id)}
              type="button"
            >
              <Icon name={tab.icon} size={14} />
              {tab.label}
            </button>
          ))}
        </div>
        <div className="ui-dock-panel__controls">
          <IconButton
            aria-label={maximized ? 'Restore panel' : 'Maximize panel'}
            onClick={() => dock?.setMode(maximized ? 'partial' : 'maximized')}
            variant="ghost"
          >
            <Icon name={maximized ? 'minimize-2' : 'maximize-2'} size={14} />
          </IconButton>
          <IconButton
            aria-label="Hide panel"
            onClick={() => dock?.setMode('hidden')}
            variant="ghost"
          >
            <Icon name="panel-right-close" size={14} />
          </IconButton>
        </div>
      </div>

      <div className="ui-dock-panel__body">{active?.content}</div>
    </aside>
  );
}
