import {
  type KeyboardEvent,
  type PointerEvent,
  type ReactElement,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Icon } from '../../primitives/index.js';
import './resizable-split.css';

export interface ResizableSplitProps {
  readonly leftSlot: ReactNode;
  readonly rightSlot: ReactNode;
  readonly leftPercent: number;
  readonly onChange: (leftPercent: number) => void;
  readonly minLeftPercent?: number;
  readonly maxLeftPercent?: number;
  readonly keyboardStep?: number;
  readonly animated?: boolean;
  readonly handleHidden?: boolean;
  /** Right pane covers the full width; the left pane keeps its size underneath
   *  (so promoting to a full panel slides over the content without reflowing it). */
  readonly coverRight?: boolean;
  /** Fires after the user drags past the minimum and holds there for `overshootDelay`. */
  readonly onOvershootMin?: () => void;
  readonly overshootDelay?: number;
}

const DEFAULT_KEYBOARD_STEP = 2;
const DEFAULT_OVERSHOOT_DELAY = 600;

/** Two panes split by a draggable vertical handle; resizes by pointer or arrow keys. */
export function ResizableSplit({
  leftSlot,
  rightSlot,
  leftPercent,
  onChange,
  minLeftPercent = 0,
  maxLeftPercent = 100,
  keyboardStep = DEFAULT_KEYBOARD_STEP,
  animated = false,
  handleHidden = false,
  coverRight = false,
  onOvershootMin,
  overshootDelay = DEFAULT_OVERSHOOT_DELAY,
}: ResizableSplitProps): ReactElement {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const overshootTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearOvershoot = useCallback(() => {
    if (overshootTimer.current !== null) {
      clearTimeout(overshootTimer.current);
      overshootTimer.current = null;
    }
  }, []);

  const clamp = useCallback(
    (raw: number) => Math.min(maxLeftPercent, Math.max(minLeftPercent, raw)),
    [maxLeftPercent, minLeftPercent],
  );

  const percentFromX = useCallback((clientX: number): number | null => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return null;
    return ((clientX - rect.left) / rect.width) * 100;
  }, []);

  function onPointerDown(event: PointerEvent<HTMLDivElement>): void {
    if (handleHidden) return;
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>): void {
    if (!dragging) return;
    const raw = percentFromX(event.clientX);
    if (raw === null) return;
    onChange(clamp(raw));
    // Insisting past the minimum (pushing the left pane smaller than allowed)
    // promotes to a full panel after a short dwell.
    if (onOvershootMin && raw < minLeftPercent) {
      if (overshootTimer.current === null) {
        overshootTimer.current = setTimeout(() => {
          overshootTimer.current = null;
          setDragging(false);
          onOvershootMin();
        }, overshootDelay);
      }
    } else {
      clearOvershoot();
    }
  }

  function endDrag(event: PointerEvent<HTMLDivElement>): void {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    clearOvershoot();
    setDragging(false);
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>): void {
    if (handleHidden) return;
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      onChange(clamp(leftPercent - keyboardStep));
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      onChange(clamp(leftPercent + keyboardStep));
    }
  }

  // While dragging, lock the page cursor and disable selection across the app.
  useEffect(() => {
    if (!dragging || typeof document === 'undefined') return;
    const prevCursor = document.body.style.cursor;
    const prevSelect = document.body.style.userSelect;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    return () => {
      document.body.style.cursor = prevCursor;
      document.body.style.userSelect = prevSelect;
    };
  }, [dragging]);

  useEffect(() => {
    return () => clearOvershoot();
  }, [clearOvershoot]);

  const left = clamp(leftPercent);
  const transition =
    animated && !dragging ? 'width var(--duration-normal) var(--easing-emphasized)' : 'none';

  return (
    <div className="ui-resizable-split" ref={containerRef}>
      <div
        className="ui-resizable-split__pane ui-resizable-split__pane--left"
        style={{ transition, width: `${left}%` }}
      >
        {leftSlot}
      </div>
      <div
        className="ui-resizable-split__pane ui-resizable-split__pane--right"
        style={{ transition, width: coverRight ? '100%' : `${100 - left}%` }}
      >
        {rightSlot}
      </div>
      {/* biome-ignore lint/a11y/useSemanticElements: a draggable splitter needs role=separator with pointer capture and keyboard resize, which <hr> cannot provide. */}
      <div
        aria-hidden={handleHidden || undefined}
        aria-label="Resize panels"
        aria-orientation="vertical"
        aria-valuemax={maxLeftPercent}
        aria-valuemin={minLeftPercent}
        aria-valuenow={Math.round(left)}
        className="ui-resizable-split__handle"
        data-hidden={handleHidden ? 'true' : undefined}
        data-state={dragging ? 'dragging' : 'idle'}
        onKeyDown={onKeyDown}
        onPointerCancel={endDrag}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        role="separator"
        style={{ left: `${left}%` }}
        tabIndex={handleHidden ? -1 : 0}
      >
        <span className="ui-resizable-split__line" />
        <span className="ui-resizable-split__grip">
          <Icon name="grip-vertical" size={14} />
        </span>
        <span className="ui-resizable-split__line" />
      </div>
    </div>
  );
}
