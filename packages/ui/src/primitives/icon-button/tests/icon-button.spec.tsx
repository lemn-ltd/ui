import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { IconButton, type IconButtonVariant } from '../icon-button.js';

const VARIANTS: IconButtonVariant[] = [
  'ghost',
  'ghost-accent',
  'ghost-danger',
  'primary',
  'default',
];

describe('IconButton', () => {
  afterEach(() => cleanup());

  it('defaults to the ghost variant and button type', () => {
    const { container } = render(<IconButton aria-label="Settings">icon</IconButton>);
    const button = container.querySelector('button');
    expect(button?.getAttribute('data-variant')).toBe('ghost');
    expect(button?.getAttribute('type')).toBe('button');
    expect(button?.className).toContain('ui-icon-button');
  });

  it('maps every variant to data-variant', () => {
    for (const variant of VARIANTS) {
      const { container, unmount } = render(
        <IconButton aria-label="Action" variant={variant}>
          icon
        </IconButton>,
      );
      expect(container.querySelector('button')?.getAttribute('data-variant')).toBe(variant);
      unmount();
    }
  });

  it('forwards the aria-label and renders children', () => {
    const { container } = render(<IconButton aria-label="Settings">glyph</IconButton>);
    const button = container.querySelector('button');
    expect(button?.getAttribute('aria-label')).toBe('Settings');
    expect(button?.textContent).toBe('glyph');
  });

  it('forwards disabled', () => {
    const { container } = render(
      <IconButton aria-label="Settings" disabled>
        icon
      </IconButton>,
    );
    expect(container.querySelector('button')?.disabled).toBe(true);
  });
});
