import { createContext, useContext } from 'react';

/** The resolved collapse signal a Sidebar shares with its brand/search/org/user slots. */
export interface SidebarChrome {
  readonly rail: boolean;
}

const SidebarChromeContext = createContext<SidebarChrome | null>(null);

export const SidebarChromeProvider = SidebarChromeContext.Provider;

/** Read the enclosing Sidebar's rail signal, or `null` when used outside one. */
export function useSidebarChrome(): SidebarChrome | null {
  return useContext(SidebarChromeContext);
}
