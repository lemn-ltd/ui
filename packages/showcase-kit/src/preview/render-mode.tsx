import {
  createContext,
  type ReactElement,
  type ReactNode,
  useContext,
} from 'react';

export type ShowcaseRenderMode = 'page' | 'card' | 'playground';

const ShowcaseRenderModeContext = createContext<ShowcaseRenderMode>('page');

export interface ShowcaseRenderModeProviderProps {
  readonly children: ReactNode;
  readonly mode: ShowcaseRenderMode;
}

export function ShowcaseRenderModeProvider({
  children,
  mode,
}: ShowcaseRenderModeProviderProps): ReactElement {
  return (
    <ShowcaseRenderModeContext.Provider value={mode}>
      {children}
    </ShowcaseRenderModeContext.Provider>
  );
}

export function useShowcaseRenderMode(): ShowcaseRenderMode {
  return useContext(ShowcaseRenderModeContext);
}

export function ShowcasePreviewCanvas({ children }: { readonly children: ReactNode }): ReactElement {
  const mode = useShowcaseRenderMode();

  return (
    <div
      className="showcase-render-preview"
      data-showcase-preview-content=""
      data-showcase-render-mode={mode}
    >
      {children}
    </div>
  );
}
