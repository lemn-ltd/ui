import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { ProgressCircle } from '../progress-circle.js';

describe('ProgressCircle', () => {
  afterEach(() => cleanup());

  it('clamps determinate values and exposes progress semantics', () => {
    const { getByRole } = render(<ProgressCircle aria-label="Upload" max={10} value={12} />);
    expect(getByRole('progressbar', { name: 'Upload' }).getAttribute('aria-valuenow')).toBe('10');
  });

  it('omits numeric ARIA values when indeterminate', () => {
    const { getByRole } = render(<ProgressCircle aria-label="Upload" />);
    expect(getByRole('progressbar').getAttribute('aria-valuenow')).toBeNull();
  });
});
