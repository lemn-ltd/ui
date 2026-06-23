import {
  type ReactElement,
  type ReactNode,
  type RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Icon, IconButton } from '../../primitives/index.js';
import { ResizableSplit } from '../resizable-split/resizable-split.js';
import {
  type DockMode,
  ShellContextProvider,
  type ShellDock,
  type ShellSidebar,
  type SidebarCollapse,
  type SidebarMode,
} from './shell-context.js';
import './screen-shell.css';

const MOBILE_QUERY = '(max-width: 768px)';
const DOCK_DEFAULT_SPLIT = 60;
const DOCK_MIN_SPLIT = 44;
const DOCK_MAX_SPLIT = 82;

export interface ScreenShellProps {
  readonly sidebar: ReactNode;
  readonly children: ReactNode;
  readonly topBar?: ReactNode;

  readonly defaultSidebarMode?: SidebarMode;
  /** Which states the collapse control walks through. Default `expand-hide`. */
  readonly collapseBehavior?: SidebarCollapse;
  readonly onSidebarModeChange?: (mode: SidebarMode) => void;

  /** Right dock content (e.g. a DockPanel). Enables the resizable right panel. */
  readonly rightPanel?: ReactNode;
  readonly defaultDockMode?: DockMode;
  readonly dockStorageKey?: string;
}

export function ScreenShell({
  sidebar,
  children,
  topBar,
  defaultSidebarMode = 'expanded',
  collapseBehavior = 'expand-hide',
  onSidebarModeChange,
  rightPanel,
  defaultDockMode = 'hidden',
  dockStorageKey = 'shell',
}: ScreenShellProps): ReactElement {
  // Read the viewport at init so a mobile first paint starts with the drawer
  // closed instead of flashing a full-width open drawer (SSR resolves to false).
  const [isMobile, setIsMobile] = useState(readMobile);
  const [sidebarMode, setSidebarModeState] = useState<SidebarMode>(() =>
    readMobile() ? 'hidden' : defaultSidebarMode,
  );

  const isMobileRef = useRef(isMobile);
  isMobileRef.current = isMobile;
  const sidebarModeRef = useRef(sidebarMode);
  sidebarModeRef.current = sidebarMode;
  const collapseBehaviorRef = useRef(collapseBehavior);
  collapseBehaviorRef.current = collapseBehavior;
  const onSidebarModeChangeRef = useRef(onSidebarModeChange);
  onSidebarModeChangeRef.current = onSidebarModeChange;

  // Remember the desktop mode so it survives a mobile round-trip.
  const desktopModeRef = useRef<SidebarMode>(
    sidebarMode === 'hidden' && isMobile ? defaultSidebarMode : sidebarMode,
  );
  useEffect(() => {
    if (!isMobile) desktopModeRef.current = sidebarMode;
  }, [sidebarMode, isMobile]);

  const setSidebarMode = useCallback((next: SidebarMode) => {
    // Mobile has no rail — the only collapse is the closed drawer.
    const resolved = isMobileRef.current && next === 'rail' ? 'hidden' : next;
    setSidebarModeState(resolved);
    onSidebarModeChangeRef.current?.(resolved);
  }, []);

  const cycleSidebar = useCallback(() => {
    setSidebarMode(
      nextSidebarMode(sidebarModeRef.current, isMobileRef.current, collapseBehaviorRef.current),
    );
  }, [setSidebarMode]);

  // Right dock state (used only when `rightPanel` is provided).
  const [dockMode, setDockModeState] = useState<DockMode>(defaultDockMode);
  const [activeTab, setActiveTabState] = useState(() => readDockTab(dockStorageKey) ?? '');
  const [splitPercent, setSplitPercentState] = useState(
    () => readDockSplit(dockStorageKey) ?? DOCK_DEFAULT_SPLIT,
  );
  const hasDockRef = useRef(rightPanel != null);
  hasDockRef.current = rightPanel != null;

  const setDockMode = useCallback((next: DockMode) => {
    // Mobile has no partial split — the panel is hidden or full.
    setDockModeState(isMobileRef.current && next === 'partial' ? 'maximized' : next);
  }, []);

  const cycleDock = useCallback(() => {
    setDockModeState((current) => {
      if (isMobileRef.current) return current === 'hidden' ? 'maximized' : 'hidden';
      if (current === 'partial') return 'hidden';
      if (current === 'hidden') return 'maximized';
      return 'partial';
    });
  }, []);

  const setActiveTab = useCallback(
    (tab: string) => {
      setActiveTabState(tab);
      writeDock(`ui-dock-tab.${dockStorageKey}`, tab);
    },
    [dockStorageKey],
  );

  const setSplitPercent = useCallback(
    (percent: number) => {
      const clamped = Math.min(DOCK_MAX_SPLIT, Math.max(DOCK_MIN_SPLIT, percent));
      setSplitPercentState(clamped);
      writeDock(`ui-dock-split.${dockStorageKey}`, String(clamped));
    },
    [dockStorageKey],
  );

  // Track the breakpoint. Entering mobile closes the drawer; returning to desktop
  // restores the remembered mode. Mode changes here route through the same
  // notification path so a controlled observer stays in sync.
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const query = window.matchMedia(MOBILE_QUERY);
    function apply(matches: boolean): void {
      setIsMobile(matches);
      const next: SidebarMode = matches ? 'hidden' : desktopModeRef.current;
      setSidebarModeState(next);
      if (next !== sidebarModeRef.current) onSidebarModeChangeRef.current?.(next);
    }
    apply(query.matches);
    const onChange = (event: MediaQueryListEvent): void => apply(event.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  // Cmd/Ctrl+B cycles the sidebar; Cmd/Ctrl+J cycles the dock; Escape closes the
  // open mobile drawer. All ignore typing so they do not steal key bindings.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent): void {
      handleShellKeyDown(event, {
        cycleDock,
        cycleSidebar,
        hasDock: hasDockRef.current,
        isMobile: isMobileRef.current,
        setSidebarMode,
        sidebarMode: sidebarModeRef.current,
      });
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [cycleSidebar, cycleDock, setSidebarMode]);

  // Desktop collapse to hidden makes the sidebar `inert`, which would orphan
  // keyboard focus to <body>; hand it to the topbar toggle so the tab order stays
  // continuous. The mobile drawer owns its own focus handling.
  const sidebarRegionRef = useRef<HTMLDivElement>(null);
  const topbarRegionRef = useRef<HTMLDivElement>(null);
  const prevModeRef = useRef(sidebarMode);
  useEffect(() => {
    const prev = prevModeRef.current;
    prevModeRef.current = sidebarMode;
    if (isMobile || sidebarMode !== 'hidden' || prev === 'hidden') return;
    if (typeof document === 'undefined') return;
    const active = document.activeElement;
    if (active && sidebarRegionRef.current?.contains(active)) {
      topbarRegionRef.current?.querySelector<HTMLElement>('button')?.focus();
    }
  }, [sidebarMode, isMobile]);

  const shellSidebar = useMemo<ShellSidebar>(
    () => ({
      mode: sidebarMode,
      collapse: collapseBehavior,
      setMode: setSidebarMode,
      cycle: cycleSidebar,
    }),
    [sidebarMode, collapseBehavior, setSidebarMode, cycleSidebar],
  );

  const dock = useMemo<ShellDock | null>(
    () =>
      rightPanel != null
        ? {
            mode: dockMode,
            activeTab,
            splitPercent,
            setMode: setDockMode,
            cycle: cycleDock,
            setActiveTab,
            setSplitPercent,
          }
        : null,
    [
      rightPanel,
      dockMode,
      activeTab,
      splitPercent,
      setDockMode,
      cycleDock,
      setActiveTab,
      setSplitPercent,
    ],
  );

  const shell = useMemo(
    () => ({ isMobile, sidebar: shellSidebar, dock }),
    [isMobile, shellSidebar, dock],
  );

  // The full ("cover") panel keeps the left pane at its split width underneath so
  // promoting to full slides over the content instead of reflowing it.
  const dockCover = dockMode === 'maximized' || (isMobile && dockMode !== 'hidden');
  const dockLeftPercent = dockMode === 'hidden' ? 100 : splitPercent;
  const drawerOpen = isMobile && sidebarMode !== 'hidden';

  return (
    <ScreenShellFrame
      dockCover={dockCover}
      dockLeftPercent={dockLeftPercent}
      dockMode={dockMode}
      drawerOpen={drawerOpen}
      isMobile={isMobile}
      main={children}
      rightPanel={rightPanel}
      setDockMode={setDockMode}
      setSidebarMode={setSidebarMode}
      setSplitPercent={setSplitPercent}
      shell={shell}
      sidebar={sidebar}
      sidebarRegionRef={sidebarRegionRef}
      topBar={topBar}
      topbarRegionRef={topbarRegionRef}
    />
  );
}

function ScreenShellFrame({
  dockCover,
  dockLeftPercent,
  dockMode,
  drawerOpen,
  isMobile,
  main,
  rightPanel,
  setDockMode,
  setSidebarMode,
  setSplitPercent,
  shell,
  sidebar,
  sidebarRegionRef,
  topBar,
  topbarRegionRef,
}: {
  readonly dockCover: boolean;
  readonly dockLeftPercent: number;
  readonly dockMode: DockMode;
  readonly drawerOpen: boolean;
  readonly isMobile: boolean;
  readonly main: ReactNode;
  readonly rightPanel?: ReactNode;
  readonly setDockMode: (mode: DockMode) => void;
  readonly setSidebarMode: (mode: SidebarMode) => void;
  readonly setSplitPercent: (percent: number) => void;
  readonly shell: {
    readonly isMobile: boolean;
    readonly sidebar: ShellSidebar;
    readonly dock: ShellDock | null;
  };
  readonly sidebar: ReactNode;
  readonly sidebarRegionRef: RefObject<HTMLDivElement | null>;
  readonly topBar?: ReactNode;
  readonly topbarRegionRef: RefObject<HTMLDivElement | null>;
}): ReactElement {
  return (
    <ShellContextProvider value={shell}>
      <div className="ui-screen-shell">
        <div className="ui-screen-shell__sidebar" ref={sidebarRegionRef}>
          {sidebar}
        </div>
        <ScreenShellBackdrop drawerOpen={drawerOpen} setSidebarMode={setSidebarMode} />
        <div className="ui-screen-shell__main" inert={drawerOpen ? true : undefined}>
          {topBar ? (
            <div className="ui-screen-shell__topbar" ref={topbarRegionRef}>
              {topBar}
            </div>
          ) : null}
          <ScreenShellContent
            dockCover={dockCover}
            dockLeftPercent={dockLeftPercent}
            dockMode={dockMode}
            isMobile={isMobile}
            main={main}
            rightPanel={rightPanel}
            setDockMode={setDockMode}
            setSplitPercent={setSplitPercent}
          />
        </div>
      </div>
    </ShellContextProvider>
  );
}

function ScreenShellBackdrop({
  drawerOpen,
  setSidebarMode,
}: {
  readonly drawerOpen: boolean;
  readonly setSidebarMode: (mode: SidebarMode) => void;
}): ReactElement | null {
  return drawerOpen ? (
    <button
      aria-hidden="true"
      className="ui-screen-shell__backdrop"
      onClick={() => setSidebarMode('hidden')}
      tabIndex={-1}
      type="button"
    />
  ) : null;
}

function ScreenShellContent({
  dockCover,
  dockLeftPercent,
  dockMode,
  isMobile,
  main,
  rightPanel,
  setDockMode,
  setSplitPercent,
}: {
  readonly dockCover: boolean;
  readonly dockLeftPercent: number;
  readonly dockMode: DockMode;
  readonly isMobile: boolean;
  readonly main: ReactNode;
  readonly rightPanel?: ReactNode;
  readonly setDockMode: (mode: DockMode) => void;
  readonly setSplitPercent: (percent: number) => void;
}): ReactElement {
  return (
    <div className="ui-screen-shell__content" data-dock={rightPanel != null ? 'true' : undefined}>
      {rightPanel != null ? (
        <ResizableSplit
          animated
          coverRight={dockCover}
          handleHidden={dockMode !== 'partial' || isMobile}
          leftPercent={dockLeftPercent}
          leftSlot={main}
          maxLeftPercent={dockMode === 'partial' ? DOCK_MAX_SPLIT : 100}
          minLeftPercent={dockMode === 'partial' ? DOCK_MIN_SPLIT : 0}
          onChange={setSplitPercent}
          onOvershootMin={dockMode === 'partial' ? () => setDockMode('maximized') : undefined}
          rightSlot={dockMode === 'hidden' ? null : rightPanel}
        />
      ) : (
        main
      )}
      <ScreenShellDockOpenButton
        dockMode={dockMode}
        isMobile={isMobile}
        rightPanel={rightPanel}
        setDockMode={setDockMode}
      />
    </div>
  );
}

function ScreenShellDockOpenButton({
  dockMode,
  isMobile,
  rightPanel,
  setDockMode,
}: {
  readonly dockMode: DockMode;
  readonly isMobile: boolean;
  readonly rightPanel?: ReactNode;
  readonly setDockMode: (mode: DockMode) => void;
}): ReactElement | null {
  if (rightPanel == null || dockMode !== 'hidden') return null;
  return (
    <div className="ui-screen-shell__dock-open">
      <IconButton
        aria-label="Show panel"
        onClick={() => setDockMode(isMobile ? 'maximized' : 'partial')}
        variant="ghost"
      >
        <Icon name="panel-right-open" size={18} />
      </IconButton>
    </div>
  );
}

function nextSidebarMode(
  current: SidebarMode,
  isMobile: boolean,
  collapseBehavior: SidebarCollapse,
): SidebarMode {
  if (isMobile) return current === 'hidden' ? 'expanded' : 'hidden';
  if (collapseBehavior === 'expand-hide') return current === 'expanded' ? 'hidden' : 'expanded';
  if (collapseBehavior === 'expand-rail') return current === 'expanded' ? 'rail' : 'expanded';
  return nextExpandRailHideMode(current);
}

function nextExpandRailHideMode(current: SidebarMode): SidebarMode {
  if (current === 'expanded') return 'rail';
  if (current === 'rail') return 'hidden';
  return 'expanded';
}

function handleShellKeyDown(
  event: KeyboardEvent,
  input: {
    readonly cycleDock: () => void;
    readonly cycleSidebar: () => void;
    readonly hasDock: boolean;
    readonly isMobile: boolean;
    readonly setSidebarMode: (mode: SidebarMode) => void;
    readonly sidebarMode: SidebarMode;
  },
): void {
  if (isTypingTarget(event.target)) return;
  const cmd = event.metaKey || event.ctrlKey;
  if (cmd && event.key.toLowerCase() === 'b') {
    event.preventDefault();
    input.cycleSidebar();
    return;
  }
  if (cmd && event.key.toLowerCase() === 'j' && input.hasDock) {
    event.preventDefault();
    input.cycleDock();
    return;
  }
  if (event.key === 'Escape' && input.isMobile && input.sidebarMode !== 'hidden') {
    input.setSidebarMode('hidden');
  }
}

function isTypingTarget(target: EventTarget | null): boolean {
  const element = target as HTMLElement | null;
  return (
    element?.tagName === 'INPUT' ||
    element?.tagName === 'TEXTAREA' ||
    element?.isContentEditable === true
  );
}

function readMobile(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia(MOBILE_QUERY).matches;
}

function readDockSplit(key: string): number | null {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  const raw = window.localStorage.getItem(`ui-dock-split.${key}`);
  const parsed = raw === null ? Number.NaN : Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

function readDockTab(key: string): string | null {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  return window.localStorage.getItem(`ui-dock-tab.${key}`);
}

function writeDock(key: string, value: string): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  window.localStorage.setItem(key, value);
}
