import { createContext, useContext } from 'react';

/** Sidebar collapse: full labels, an icon-only rail, or fully hidden. */
export type SidebarMode = 'expanded' | 'rail' | 'hidden';

/**
 * What the collapse control (`cycle`, the TopBar toggle, Cmd/Ctrl+B) walks through.
 * `expand-hide`: expanded ↔ hidden. `expand-rail`: expanded ↔ rail. `cycle`:
 * expanded → rail → hidden. Mobile always behaves as expanded ↔ hidden.
 */
export type SidebarCollapse = 'expand-hide' | 'expand-rail' | 'cycle';

export interface ShellSidebar {
  readonly mode: SidebarMode;
  readonly collapse: SidebarCollapse;
  setMode(mode: SidebarMode): void;
  cycle(): void;
}

export type DockMode = 'hidden' | 'partial' | 'maximized';

/** Right dock state, present only when the ScreenShell has a `rightPanel`. */
export interface ShellDock {
  readonly mode: DockMode;
  readonly activeTab: string;
  readonly splitPercent: number;
  setMode(mode: DockMode): void;
  cycle(): void;
  setActiveTab(tab: string): void;
  setSplitPercent(percent: number): void;
}

/** Sidebar collapse + right dock state a ScreenShell shares with its chrome. */
export interface ShellContextValue {
  /** True below the shell's mobile breakpoint, where the sidebar is an overlay drawer. */
  readonly isMobile: boolean;

  readonly sidebar: ShellSidebar;

  /** Right dock state, or `null` when the shell has no `rightPanel`. */
  readonly dock: ShellDock | null;
}

const ShellContext = createContext<ShellContextValue | null>(null);

export const ShellContextProvider = ShellContext.Provider;

/** Read the enclosing ScreenShell collapse state, or `null` when used standalone. */
export function useShell(): ShellContextValue | null {
  return useContext(ShellContext);
}
