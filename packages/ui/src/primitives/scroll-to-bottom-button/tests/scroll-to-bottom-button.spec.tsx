import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ScrollToBottomButton } from '../scroll-to-bottom-button.js';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('ScrollToBottomButton', () => {
  it('stays hidden while the scroll container is near the bottom', () => {
    const scrollRef = mountedScrollRef({ clientHeight: 200, scrollHeight: 240, scrollTop: 20 });

    render(<ScrollToBottomButton scrollRef={scrollRef} />);

    expect(screen.queryByRole('button', { name: 'Scroll to bottom' })).toBeNull();
  });

  it('shows when the scroll container is away from the bottom and scrolls down on click', () => {
    const scrollTo = vi.fn();
    const scrollRef = mountedScrollRef({
      clientHeight: 200,
      scrollHeight: 600,
      scrollTo,
      scrollTop: 0,
    });

    render(<ScrollToBottomButton scrollRef={scrollRef} />);
    fireEvent.scroll(scrollRef.current as HTMLElement);
    fireEvent.click(screen.getByRole('button', { name: 'Scroll to bottom' }));

    expect(scrollTo).toHaveBeenCalledWith({ top: 600, behavior: 'smooth' });
  });

  it('auto-scrolls new content while pinned to the bottom', async () => {
    const scrollRef = mountedScrollRef({ clientHeight: 200, scrollHeight: 320, scrollTop: 120 });

    render(<ScrollToBottomButton scrollRef={scrollRef} />);

    await act(async () => {
      scrollRef.current?.append(document.createElement('div'));
    });

    await waitFor(() => expect(scrollRef.current?.scrollTop).toBe(320));
  });
});

function mountedScrollRef({
  clientHeight,
  scrollHeight,
  scrollTo,
  scrollTop,
}: {
  readonly clientHeight: number;
  readonly scrollHeight: number;
  readonly scrollTo?: HTMLElement['scrollTo'];
  readonly scrollTop: number;
}) {
  const element = document.createElement('div');
  let currentScrollTop = scrollTop;
  Object.defineProperties(element, {
    clientHeight: { configurable: true, value: clientHeight },
    scrollHeight: { configurable: true, value: scrollHeight },
    scrollTop: {
      configurable: true,
      get: () => currentScrollTop,
      set: (value: number) => {
        currentScrollTop = value;
      },
    },
  });
  element.scrollTo = scrollTo ?? vi.fn();
  return { current: element };
}
