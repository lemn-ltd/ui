import type { ReactElement, ReactNode } from 'react';
import { useShell } from '../../layout/screen-shell/shell-context.js';
import { Icon, Kbd } from '../../primitives/index.js';
import { useSidebarChrome } from '../sidebar/sidebar-chrome-context.js';
import './search-command.css';

export interface SearchCommandProps {
  readonly onSelect?: () => void;
  readonly label?: string;
  readonly shortcut?: ReactNode;
}

/** Persistent search trigger that opens a command palette, with a shortcut hint. */
export function SearchCommand({
  onSelect,
  label = 'Search',
  shortcut = '⌘K',
}: SearchCommandProps): ReactElement {
  const shell = useShell();
  const rail = useSidebarChrome()?.rail ?? shell?.sidebar.mode === 'rail';

  // In a desktop rail the trigger condenses to an icon so it stays available
  // without disappearing or reflowing the rail.
  if (rail) {
    return (
      <button
        aria-label={label}
        className="ui-search-command ui-search-command--rail"
        onClick={onSelect}
        type="button"
      >
        <Icon name="search" size={18} />
      </button>
    );
  }

  return (
    <button className="ui-search-command" onClick={onSelect} type="button">
      <span className="ui-search-command__left">
        <Icon name="search" size={16} />
        <span className="ui-search-command__label">{label}</span>
      </span>
      <Kbd>{shortcut}</Kbd>
    </button>
  );
}
