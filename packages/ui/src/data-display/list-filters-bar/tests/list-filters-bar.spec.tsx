import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { ListFiltersBar } from '../list-filters-bar.js';

describe('ListFiltersBar', () => {
  afterEach(() => cleanup());

  it('passes the per-view placeholder to the rendered input', () => {
    const { container } = render(
      <ListFiltersBar onSearchChange={() => {}} search="" searchPlaceholder="Search sessions" />,
    );
    const input = container.querySelector('.ui-input-search__input') as HTMLInputElement;
    expect(input.getAttribute('placeholder')).toBe('Search sessions');
  });

  it('renders pills and trailing slots', () => {
    const { getByText } = render(
      <ListFiltersBar
        onSearchChange={() => {}}
        pills={<span>pill</span>}
        search=""
        trailing={<span>trailing</span>}
      />,
    );
    expect(getByText('pill')).not.toBeNull();
    expect(getByText('trailing')).not.toBeNull();
  });

  it('omits the search input when no search handler is supplied', () => {
    const { container } = render(<ListFiltersBar pills={<span>Namespace</span>} />);
    expect(container.querySelector('.ui-input-search__input')).toBeNull();
  });
});
