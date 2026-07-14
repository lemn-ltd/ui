import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BarList } from '../bar-list.js';

describe('BarList', () => {
  afterEach(() => cleanup());

  it('uses semantic links and buttons for interactive rows', () => {
    const onSelect = vi.fn();
    const { getByRole } = render(
      <BarList
        aria-label="Top pages"
        items={[
          { href: '/docs', label: 'Docs', value: 80 },
          { label: 'Dashboard', onSelect, value: 40 },
        ]}
      />,
    );
    expect(getByRole('link', { name: /Docs 80/ })).toBeTruthy();
    fireEvent.click(getByRole('button', { name: /Dashboard 40/ }));
    expect(onSelect).toHaveBeenCalledOnce();
  });
});
