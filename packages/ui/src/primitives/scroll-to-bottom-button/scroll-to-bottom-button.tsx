import type { ButtonHTMLAttributes, MouseEvent, ReactElement, RefObject } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Icon } from '../icon/icon.js';
import './scroll-to-bottom-button.css';

const BOTTOM_THRESHOLD_PX = 80;

export interface ScrollToBottomButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  readonly scrollRef: RefObject<HTMLElement | null>;
}

export function ScrollToBottomButton({
  scrollRef,
  className,
  onClick,
  type = 'button',
  'aria-label': ariaLabel = 'Scroll to bottom',
  ...rest
}: ScrollToBottomButtonProps): ReactElement | null {
  const [visible, setVisible] = useState(false);
  const isAtBottomRef = useRef(true);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const view = container.ownerDocument.defaultView;
    if (!view) return;

    const scrollContainer: HTMLElement = container;

    let animationFrame: number | null = null;
    let initialScrollDone = false;

    function isAtBottom(): boolean {
      return (
        scrollContainer.scrollHeight - scrollContainer.scrollTop - scrollContainer.clientHeight <
        BOTTOM_THRESHOLD_PX
      );
    }

    function scrollToEnd() {
      scrollContainer.scrollTop = scrollContainer.scrollHeight;
    }

    function updateVisibility() {
      const atBottom = isAtBottom();
      setVisible(!atBottom);
      if (atBottom) isAtBottomRef.current = true;
    }

    function onUserScroll() {
      const atBottom = isAtBottom();
      isAtBottomRef.current = atBottom;
      setVisible(!atBottom);
    }

    const mutationObserver = new view.MutationObserver(() => {
      if (!initialScrollDone) {
        scrollToEnd();
        if (scrollContainer.scrollHeight > scrollContainer.clientHeight) {
          initialScrollDone = true;
          isAtBottomRef.current = true;
        }
        return;
      }

      if (!isAtBottomRef.current || animationFrame !== null) return;
      animationFrame = view.requestAnimationFrame(() => {
        animationFrame = null;
        if (isAtBottomRef.current) scrollToEnd();
      });
    });

    updateVisibility();
    scrollContainer.addEventListener('scroll', updateVisibility, { passive: true });
    scrollContainer.addEventListener('wheel', onUserScroll, { passive: true });
    scrollContainer.addEventListener('touchmove', onUserScroll, { passive: true });
    scrollContainer.addEventListener('keydown', onUserScroll, { passive: true });
    mutationObserver.observe(scrollContainer, {
      childList: true,
      characterData: true,
      subtree: true,
    });

    return () => {
      scrollContainer.removeEventListener('scroll', updateVisibility);
      scrollContainer.removeEventListener('wheel', onUserScroll);
      scrollContainer.removeEventListener('touchmove', onUserScroll);
      scrollContainer.removeEventListener('keydown', onUserScroll);
      mutationObserver.disconnect();
      if (animationFrame !== null) view.cancelAnimationFrame(animationFrame);
    };
  }, [scrollRef]);

  const scrollToBottom = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      isAtBottomRef.current = true;
      onClick?.(event);
      if (event.defaultPrevented) return;
      const container = scrollRef.current;
      if (!container) return;
      container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
    },
    [onClick, scrollRef],
  );

  if (!visible) return null;

  return (
    <button
      aria-label={ariaLabel}
      className={['ui-scroll-to-bottom-button', className].filter(Boolean).join(' ')}
      onClick={scrollToBottom}
      type={type}
      {...rest}
    >
      <Icon name="chevron-down" size={14} />
    </button>
  );
}
