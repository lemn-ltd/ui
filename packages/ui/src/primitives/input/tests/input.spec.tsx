import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { Input } from '../input.js';

describe('Input', () => {
  afterEach(() => cleanup());

  it('marks the invalid state with data-invalid and aria-invalid', () => {
    const { container } = render(<Input invalid />);
    const input = container.querySelector('input');
    expect(input?.getAttribute('data-invalid')).toBe('true');
    expect(input?.getAttribute('aria-invalid')).toBe('true');
  });

  it('omits both invalid attributes when not invalid', () => {
    const { container } = render(<Input />);
    const input = container.querySelector('input');
    expect(input?.hasAttribute('data-invalid')).toBe(false);
    expect(input?.hasAttribute('aria-invalid')).toBe(false);
  });

  it('renders the placeholder and base className', () => {
    const { container } = render(<Input placeholder="Email" />);
    const input = container.querySelector('input');
    expect(input?.getAttribute('placeholder')).toBe('Email');
    expect(input?.className).toContain('ui-input');
  });

  it('forwards disabled', () => {
    const { container } = render(<Input disabled />);
    expect(container.querySelector('input')?.disabled).toBe(true);
  });
});
