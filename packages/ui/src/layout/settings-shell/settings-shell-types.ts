import type { ReactNode } from 'react';
import type { IconName } from '../../primitives/index.js';

/** A single selectable settings section in the navigation rail. */
export interface SettingsNavItem {
  readonly id: string;
  readonly label: ReactNode;

  readonly icon?: IconName;
  readonly badge?: ReactNode;
  readonly disabled?: boolean;
  /** Plain text matched by the search filter when `label` is not a string. */
  readonly keywords?: string;
}

/** A titled cluster of settings sections. */
export interface SettingsNavGroup {
  readonly id?: string;
  readonly header?: ReactNode;
  readonly items: readonly SettingsNavItem[];
}

/** `plain` fills a route region; `surface` adds a bordered, rounded card frame. */
export type SettingsShellVariant = 'plain' | 'surface';
