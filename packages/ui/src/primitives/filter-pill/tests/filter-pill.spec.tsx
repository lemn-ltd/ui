import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { FilterPill } from '../filter-pill.js';

describe('FilterPill', () => {
  afterEach(() => cleanup());

  it('defaults to inactive, closed, and button type', () => {
    const { container } = render(<FilterPill>Status</FilterPill>);
    const button = container.querySelector('button');
    expect(button?.getAttribute('data-active')).toBe('false');
    expect(button?.getAttribute('data-open')).toBe('false');
    expect(button?.getAttribute('type')).toBe('button');
    expect(button?.className).toContain('ui-filter-pill');
  });

  it('marks the active state', () => {
    const { container } = render(<FilterPill active>Status</FilterPill>);
    expect(container.querySelector('button')?.getAttribute('data-active')).toBe('true');
  });

  it('marks the open state', () => {
    const { container } = render(<FilterPill open>Status</FilterPill>);
    expect(container.querySelector('button')?.getAttribute('data-open')).toBe('true');
  });

  it('renders the label children and the chevron icon', () => {
    const { container } = render(<FilterPill>Status</FilterPill>);
    expect(container.querySelector('.ui-filter-pill__label')?.textContent).toBe('Status');
    expect(container.querySelector('svg.ui-filter-pill__chevron')).not.toBeNull();
  });
});
