import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Pagination } from '../pagination.js';

describe('Pagination', () => {
  afterEach(() => cleanup());

  it('renders the range text with an en dash', () => {
    const { container } = render(
      <Pagination onPageChange={vi.fn()} page={1} pageSize={10} total={137} />,
    );
    expect(container.querySelector('.ui-pagination__range')?.textContent).toBe('1–10 of 137');
  });

  it('disables the previous control on the first page', () => {
    const { container } = render(
      <Pagination onPageChange={vi.fn()} page={1} pageSize={10} total={137} />,
    );
    const prev = container.querySelector('.ui-icon-button[aria-label="Previous page"]');
    expect((prev as HTMLButtonElement | null)?.disabled).toBe(true);
  });

  it('calls onPageChange when a numbered page is clicked', () => {
    const onPageChange = vi.fn();
    const { container } = render(
      <Pagination onPageChange={onPageChange} page={1} pageSize={10} total={137} />,
    );
    const pages = Array.from(container.querySelectorAll('.ui-pagination__page'));
    const second = pages.find((page) => page.textContent === '2');
    fireEvent.click(second as Element);
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it('renders an ellipsis for the gap between page anchors', () => {
    const { container } = render(
      <Pagination onPageChange={vi.fn()} page={1} pageSize={10} total={137} />,
    );
    expect(container.querySelector('.ui-pagination__ellipsis')).not.toBeNull();
  });

  it('renders the page-size select trigger when onPageSizeChange is given', () => {
    const { container } = render(
      <Pagination
        onPageChange={vi.fn()}
        onPageSizeChange={vi.fn()}
        page={1}
        pageSize={10}
        total={137}
      />,
    );
    const select = container.querySelector('.ui-pagination__page-size');
    expect(select).not.toBeNull();
    expect(select?.tagName).toBe('BUTTON');
  });

  it('renders a single load-more button and calls onLoadMore on click', () => {
    const onLoadMore = vi.fn();
    const { container } = render(
      <Pagination
        onLoadMore={onLoadMore}
        onPageChange={vi.fn()}
        page={1}
        pageSize={10}
        total={137}
        variant="load-more"
      />,
    );
    const buttons = Array.from(container.querySelectorAll('button'));
    expect(buttons).toHaveLength(1);
    expect(buttons[0]?.textContent).toBe('Load more');
    fireEvent.click(buttons[0] as Element);
    expect(onLoadMore).toHaveBeenCalledTimes(1);
  });
});
