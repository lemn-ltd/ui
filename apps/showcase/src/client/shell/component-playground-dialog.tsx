import { Button, Dialog, Icon, SegmentedControl } from '@lemn-ltd/ui';
import { type ReactElement, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { pathFor } from '../registry/showcase-registry';
import type { UiShowcaseEntry } from '../registry/showcase-types';

type PlaygroundTheme = 'light' | 'dark';
type PlaygroundViewport = 'mobile' | 'tablet' | 'desktop';

const VIEWPORTS: Readonly<
  Record<PlaygroundViewport, { readonly width: number; readonly height: number }>
> = {
  mobile: { width: 375, height: 812 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1280, height: 900 },
};

const VIEWPORT_SEGMENTS = [
  { value: 'mobile', label: '375', icon: 'minimize-2' },
  { value: 'tablet', label: '768', icon: 'maximize' },
  { value: 'desktop', label: '1280', icon: 'monitor' },
] as const;

const THEME_SEGMENTS = [
  { value: 'light', label: 'Light', icon: 'sun' },
  { value: 'dark', label: 'Dark', icon: 'moon' },
] as const;

export interface ComponentPlaygroundDialogProps {
  readonly entry: UiShowcaseEntry | undefined;
  readonly onOpenChange: (open: boolean) => void;
}

export function ComponentPlaygroundDialog({
  entry,
  onOpenChange,
}: ComponentPlaygroundDialogProps): ReactElement {
  const stageRef = useRef<HTMLDivElement>(null);
  const [viewport, setViewport] = useState<PlaygroundViewport>(() =>
    typeof window !== 'undefined' && window.innerWidth <= 640 ? 'mobile' : 'desktop',
  );
  const [theme, setTheme] = useState<PlaygroundTheme>('light');
  const [reset, setReset] = useState(0);
  const [scale, setScale] = useState(1);
  const [loaded, setLoaded] = useState(false);
  const dimensions = VIEWPORTS[viewport];

  useEffect(() => {
    setReset(0);
    setLoaded(false);
  }, [entry]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const measure = (): void => {
      const horizontalPadding = 32;
      const verticalPadding = 32;
      setScale(
        Math.min(
          1,
          Math.max(0.1, (stage.clientWidth - horizontalPadding) / dimensions.width),
          Math.max(0.1, (stage.clientHeight - verticalPadding) / dimensions.height),
        ),
      );
    };

    const observer = new ResizeObserver(measure);
    observer.observe(stage);
    measure();
    return () => observer.disconnect();
  }, [dimensions]);

  const source = useMemo(() => {
    if (!entry) return '';
    const params = new URLSearchParams({
      embed: 'playground',
      theme,
      reset: String(reset),
    });
    return `${pathFor(entry)}?${params.toString()}`;
  }, [entry, reset, theme]);

  const footer = entry ? (
    <Link
      className="showcase-playground__documentation-link"
      onClick={() => onOpenChange(false)}
      to={pathFor(entry)}
    >
      View documentation
      <Icon name="arrow-right" size={14} />
    </Link>
  ) : null;

  return (
    <Dialog
      description="The canonical example runs in an isolated, responsive viewport. Interact with it exactly as a consumer would."
      footer={footer}
      onOpenChange={onOpenChange}
      open={Boolean(entry)}
      size="xl"
      title={entry ? `${entry.title} playground` : 'Component playground'}
    >
      {entry ? (
        <div className="showcase-playground" data-preview-loaded={loaded ? 'true' : 'false'}>
          <div className="showcase-playground__toolbar">
            <SegmentedControl
              aria-label="Preview viewport"
              onValueChange={(value) => {
                setLoaded(false);
                setViewport(value as PlaygroundViewport);
              }}
              segments={VIEWPORT_SEGMENTS}
              value={viewport}
            />
            <SegmentedControl
              aria-label="Preview theme"
              onValueChange={(value) => {
                setLoaded(false);
                setTheme(value as PlaygroundTheme);
              }}
              segments={THEME_SEGMENTS}
              value={theme}
            />
            <Button
              onClick={() => {
                setLoaded(false);
                setReset((value) => value + 1);
              }}
              size="sm"
              startIcon={<Icon name="rotate-ccw" size={14} />}
              variant="ghost"
            >
              Reset
            </Button>
          </div>

          <div className="showcase-playground__stage" ref={stageRef}>
            {!loaded ? (
              <span className="showcase-playground__loading">Loading interactive preview…</span>
            ) : null}
            <div
              className="showcase-playground__viewport"
              style={{ width: dimensions.width * scale, height: dimensions.height * scale }}
            >
              <iframe
                key={source}
                className="showcase-playground__frame"
                height={dimensions.height}
                onLoad={() => setLoaded(true)}
                src={source}
                style={{ transform: `scale(${scale})` }}
                title={`${entry.title} interactive preview`}
                width={dimensions.width}
              />
            </div>
          </div>
        </div>
      ) : null}
    </Dialog>
  );
}
