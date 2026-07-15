import { Command } from 'cmdk';
import { type ReactElement, useEffect, useMemo, useState } from 'react';
import { Icon, type IconName, Kbd } from '../../primitives/index.js';
import './command-palette.css';

export interface CommandPaletteItem {
  readonly id: string;
  readonly label: string;
  readonly icon?: IconName;
  readonly shortcut?: string;
  readonly keywords?: readonly string[];
  readonly onSelect?: () => void;
}

export interface CommandPaletteGroup {
  readonly label: string;
  readonly items: readonly CommandPaletteItem[];
}

export interface CommandPaletteProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly groups: readonly CommandPaletteGroup[];
  readonly placeholder?: string;
  readonly emptyMessage?: string;
}

/**
 * Substring match requiring every search word. Exact and partial label
 * matches rank above keyword-only matches so a description cannot displace a
 * component whose title is the query.
 */
function paletteFilter(
  value: string,
  search: string,
  keywords: string[] = [],
  exactLabels: ReadonlySet<string> = new Set(),
): number {
  const label = value.toLowerCase();
  const query = search.trim().toLowerCase();
  if (!query) return 1;
  if (label === query) return 1;
  if (label.startsWith(query)) return 0.9;
  const words = query.split(/\s+/);
  if (words.every((word) => label.includes(word))) return 0.8;
  const keywordText = keywords.join(' ').toLowerCase();
  if (!words.every((word) => keywordText.includes(word))) return 0;
  return exactLabels.has(query) ? 0 : 0.5;
}

export function CommandPalette({
  open,
  onOpenChange,
  groups,
  placeholder = 'Search pages, actions…',
  emptyMessage = 'No matches',
}: CommandPaletteProps): ReactElement {
  const [query, setQuery] = useState('');
  const exactLabels = useMemo(
    () =>
      new Set(
        groups.flatMap((group) => group.items.map((item) => item.label.toLowerCase())),
      ),
    [groups],
  );

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent): void {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        onOpenChange(!open);
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onOpenChange]);

  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  return (
    <Command.Dialog
      className="ui-command-palette"
      contentClassName="ui-command-palette__panel"
      filter={(value, search, keywords) =>
        paletteFilter(value, search, keywords, exactLabels)
      }
      label="Command palette"
      onOpenChange={onOpenChange}
      open={open}
      overlayClassName="ui-command-palette__overlay"
    >
      <h2 className="ui-command-palette__title">Command palette</h2>
      <p className="ui-command-palette__description">
        Search pages and actions.
      </p>
      <div className="ui-command-palette__search">
        <Icon name="search" size={20} />
        <Command.Input
          className="ui-command-palette__input"
          onValueChange={setQuery}
          placeholder={placeholder}
          value={query}
        />
        <Kbd>esc</Kbd>
      </div>
      <Command.List className="ui-command-palette__list">
        <Command.Empty className="ui-command-palette__empty">{emptyMessage}</Command.Empty>
        {groups.map((group) => (
          <Command.Group
            className="ui-command-palette__group"
            heading={group.label}
            key={group.label}
          >
            {group.items.map((item) => (
              <Command.Item
                className="ui-command-palette__item"
                key={item.id}
                keywords={[...(item.keywords ?? [])]}
                onSelect={() => {
                  item.onSelect?.();
                  onOpenChange(false);
                }}
                value={item.label}
              >
                {item.icon ? <Icon name={item.icon} size={16} /> : null}
                <span className="ui-command-palette__item-label">{item.label}</span>
                {item.shortcut ? <Kbd>{item.shortcut}</Kbd> : null}
              </Command.Item>
            ))}
          </Command.Group>
        ))}
      </Command.List>
      <div className="ui-command-palette__footer">
        <span className="ui-command-palette__hint">
          <Kbd>↑</Kbd>
          <Kbd>↓</Kbd>
          navigate
        </span>
        <span className="ui-command-palette__hint">
          <Kbd>↵</Kbd>
          select
        </span>
        <span className="ui-command-palette__hint">
          <Kbd>esc</Kbd>
          close
        </span>
      </div>
    </Command.Dialog>
  );
}
