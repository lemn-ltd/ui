import type { RefObject } from 'react';
import { useEffect, useRef } from 'react';
import { Icon } from '../../primitives/index.js';

type ExecutionMapCursorMode = 'pan' | 'drag' | 'inspect' | 'trace';

const executionMapCursorInteractiveTargetSelector = [
  '.ui-execution-map__floating-bubble',
  '.ui-execution-map__viewport-controls',
  '.react-flow__minimap',
  'a',
  'button',
  'input',
  'select',
  'textarea',
  '[contenteditable="true"]',
  '[role="button"]',
  '[role="radio"]',
  '[role="slider"]',
].join(',');

export function ExecutionMapCanvasCursor({
  stageRef,
}: {
  readonly stageRef: RefObject<HTMLElement | null>;
}) {
  const cursorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const stage = stageRef.current;
    const cursor = cursorRef.current;
    if (!stage || !cursor) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const coarsePointer = window.matchMedia('(pointer: coarse)');
    let draggingCanvas = false;

    const customCursorEnabled = () => !reducedMotion.matches && !coarsePointer.matches;
    const hideCursor = () => {
      cursor.dataset.visible = 'false';
    };
    const syncAvailability = () => {
      if (customCursorEnabled()) {
        stage.dataset.customCursor = 'true';
        return;
      }
      stage.removeAttribute('data-custom-cursor');
      hideCursor();
    };
    const moveCursor = (event: PointerEvent) => {
      if (!customCursorEnabled()) return;
      const mode = executionMapCursorModeForTarget(event.target, draggingCanvas);
      if (!mode) {
        hideCursor();
        return;
      }

      const bounds = stage.getBoundingClientRect();
      cursor.style.setProperty('--cursor-x', `${event.clientX - bounds.left}px`);
      cursor.style.setProperty('--cursor-y', `${event.clientY - bounds.top}px`);
      cursor.dataset.mode = mode;
      cursor.dataset.visible = 'true';
    };
    const onPointerDown = (event: PointerEvent) => {
      draggingCanvas = executionMapStartsCanvasDrag(event.target);
      moveCursor(event);
    };
    const onPointerMove = (event: PointerEvent) => moveCursor(event);
    const onPointerUp = (event: PointerEvent) => {
      draggingCanvas = false;
      moveCursor(event);
    };
    const onPointerLeave = () => {
      draggingCanvas = false;
      hideCursor();
    };

    syncAvailability();
    stage.addEventListener('pointerdown', onPointerDown);
    stage.addEventListener('pointermove', onPointerMove);
    stage.addEventListener('pointerup', onPointerUp);
    stage.addEventListener('pointercancel', onPointerLeave);
    stage.addEventListener('pointerleave', onPointerLeave);
    reducedMotion.addEventListener('change', syncAvailability);
    coarsePointer.addEventListener('change', syncAvailability);

    return () => {
      stage.removeAttribute('data-custom-cursor');
      stage.removeEventListener('pointerdown', onPointerDown);
      stage.removeEventListener('pointermove', onPointerMove);
      stage.removeEventListener('pointerup', onPointerUp);
      stage.removeEventListener('pointercancel', onPointerLeave);
      stage.removeEventListener('pointerleave', onPointerLeave);
      reducedMotion.removeEventListener('change', syncAvailability);
      coarsePointer.removeEventListener('change', syncAvailability);
    };
  }, [stageRef]);

  return (
    <div
      aria-hidden="true"
      className="ui-execution-map__canvas-cursor"
      data-mode="pan"
      data-visible="false"
      ref={cursorRef}
    >
      <Icon className="ui-execution-map__canvas-cursor-icon" name="pointer" size={20} />
    </div>
  );
}

function executionMapCursorModeForTarget(
  target: EventTarget | null,
  draggingCanvas: boolean,
): ExecutionMapCursorMode | null {
  if (!(target instanceof Element)) return null;
  if (draggingCanvas) return 'drag';
  if (target.closest('.ui-execution-map__node')) return 'inspect';
  if (target.closest('.react-flow__edge, .react-flow__edge-path')) return 'trace';
  if (target.closest(executionMapCursorInteractiveTargetSelector)) return null;
  return 'pan';
}

function executionMapStartsCanvasDrag(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  if (target.closest('.ui-execution-map__node, .react-flow__edge, .react-flow__edge-path')) {
    return false;
  }
  if (target.closest(executionMapCursorInteractiveTargetSelector)) return false;
  return target.closest('.react-flow__pane') !== null;
}
