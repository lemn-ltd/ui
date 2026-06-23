import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { SearchCommand } from '../search-command.js';

describe('SearchCommand', () => {
  afterEach(() => cleanup());

  it('renders the label and shortcut and fires onSelect when clicked', () => {
    const onSelect = vi.fn();
    const { getByRole, getByText } = render(<SearchCommand onSelect={onSelect} shortcut="⌘K" />);
    expect(getByText('Search')).not.toBeNull();
    expect(getByText('⌘K')).not.toBeNull();
    fireEvent.click(getByRole('button'));
    expect(onSelect).toHaveBeenCalledOnce();
  });
});
