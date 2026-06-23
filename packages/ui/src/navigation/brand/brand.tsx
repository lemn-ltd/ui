import type { ReactElement } from 'react';
import { useShell } from '../../layout/screen-shell/shell-context.js';
import { useSidebarChrome } from '../sidebar/sidebar-chrome-context.js';
import './brand.css';

export interface BrandProps {
  readonly name: string;
  /** Override the derived initials shown in the collapsed rail (e.g. for casing). */
  readonly initials?: string;
}

/** First letters of the first two words, or the first two chars of one word. */
function deriveInitials(name: string): string {
  const [first, second] = name.trim().split(/\s+/).filter(Boolean);
  if (first === undefined) return '';
  // Iterate by code point so emoji/astral names never split a surrogate pair.
  const head = (s: string): string => [...s][0] ?? '';
  const raw = second === undefined ? [...first].slice(0, 2).join('') : head(first) + head(second);
  // Clamp after casing — toUpperCase is not length-preserving (e.g. ß → SS).
  return [...raw.toUpperCase()].slice(0, 2).join('');
}

/**
 * Product brand mark: the full name when the shell is expanded, a compact initials
 * mark when it collapses to a rail. Consumers inherit the behavior by rendering it
 * inside a ScreenShell.
 */
export function Brand({ name, initials }: BrandProps): ReactElement {
  const shell = useShell();
  const rail = useSidebarChrome()?.rail ?? shell?.sidebar.mode === 'rail';
  const mark = initials ?? deriveInitials(name);

  if (rail && mark !== '') {
    return (
      <span className="ui-brand ui-brand--mark" title={name}>
        {mark}
      </span>
    );
  }

  return <span className="ui-brand">{name}</span>;
}
