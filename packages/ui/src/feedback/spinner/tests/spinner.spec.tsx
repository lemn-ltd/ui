import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { Spinner, type SpinnerSize } from '../spinner.js';

const SIZE_DIMENSION: Record<SpinnerSize, string> = {
  sm: '16px',
  md: '24px',
  lg: '32px',
};

const here = dirname(fileURLToPath(import.meta.url));
const css = readFileSync(join(here, '..', 'spinner.css'), 'utf8');

describe('Spinner', () => {
  afterEach(() => cleanup());

  it('defaults to the md size', () => {
    const { container } = render(<Spinner />);
    expect(container.querySelector('.ui-spinner')?.getAttribute('data-size')).toBe('md');
  });

  it('maps each size to data-size', () => {
    for (const size of Object.keys(SIZE_DIMENSION) as SpinnerSize[]) {
      const { container, unmount } = render(<Spinner size={size} />);
      expect(container.querySelector('.ui-spinner')?.getAttribute('data-size')).toBe(size);
      unmount();
    }
  });

  it('binds each size to the 16/24/32 dimension contract', () => {
    for (const size of Object.keys(SIZE_DIMENSION) as SpinnerSize[]) {
      const dimension = SIZE_DIMENSION[size];
      const rule = css.match(
        new RegExp(`\\.ui-spinner\\[data-size="${size}"\\]\\s*{([^}]*)}`),
      )?.[1];
      expect(rule).toBeTruthy();
      expect(rule).toContain(`width: ${dimension}`);
      expect(rule).toContain(`height: ${dimension}`);
    }
  });

  it('exposes a status role for assistive technology', () => {
    const { container } = render(<Spinner />);
    expect(container.querySelector('.ui-spinner')?.getAttribute('role')).toBe('status');
  });
});
