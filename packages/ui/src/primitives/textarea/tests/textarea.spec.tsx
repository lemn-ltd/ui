import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { Textarea } from '../textarea.js';

describe('Textarea', () => {
  afterEach(() => cleanup());

  it('defaults to three rows and the base className', () => {
    const { container } = render(<Textarea />);
    const textarea = container.querySelector('textarea');
    expect(textarea?.getAttribute('rows')).toBe('3');
    expect(textarea?.className).toContain('ui-textarea');
  });

  it('marks the invalid state with data-invalid and aria-invalid', () => {
    const { container } = render(<Textarea invalid />);
    const textarea = container.querySelector('textarea');
    expect(textarea?.getAttribute('data-invalid')).toBe('true');
    expect(textarea?.getAttribute('aria-invalid')).toBe('true');
  });

  it('renders the placeholder', () => {
    const { container } = render(<Textarea placeholder="Notes" />);
    expect(container.querySelector('textarea')?.getAttribute('placeholder')).toBe('Notes');
  });
});
