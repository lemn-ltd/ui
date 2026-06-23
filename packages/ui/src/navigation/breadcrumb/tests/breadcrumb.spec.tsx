import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { Breadcrumb, type BreadcrumbItem } from '../breadcrumb.js';

const ITEMS: readonly BreadcrumbItem[] = [
  { label: 'Home', href: '/' },
  { label: 'Projects', onClick: () => {} },
  { label: 'Current' },
];

describe('Breadcrumb', () => {
  afterEach(() => cleanup());

  it('marks the last item active and non-interactive', () => {
    const { container } = render(<Breadcrumb items={ITEMS} />);
    const all = Array.from(container.querySelectorAll('.ui-breadcrumb__item'));
    const last = all[all.length - 1];
    expect(last?.getAttribute('data-active')).toBe('true');
    expect(last?.getAttribute('aria-current')).toBe('page');
    expect(last?.tagName).toBe('SPAN');
  });

  it('renders earlier items as links or buttons', () => {
    const { container } = render(<Breadcrumb items={ITEMS} />);
    const items = Array.from(container.querySelectorAll('.ui-breadcrumb__item'));
    expect(items[0]?.tagName).toBe('A');
    expect(items[1]?.tagName).toBe('BUTTON');
  });

  it('renders a non-last item without href or onClick as a static span', () => {
    const { container } = render(
      <Breadcrumb
        items={[{ label: 'Section' }, { label: 'Detail', onClick: () => {} }, { label: 'Current' }]}
      />,
    );
    const first = container.querySelectorAll('.ui-breadcrumb__item')[0];
    expect(first?.tagName).toBe('SPAN');
    expect(first?.getAttribute('data-static')).toBe('true');
    expect(first?.getAttribute('aria-current')).toBeNull();
  });

  it('renders one fewer separator than items', () => {
    const { container } = render(<Breadcrumb items={ITEMS} />);
    expect(container.querySelectorAll('.ui-breadcrumb__separator')).toHaveLength(ITEMS.length - 1);
  });
});
