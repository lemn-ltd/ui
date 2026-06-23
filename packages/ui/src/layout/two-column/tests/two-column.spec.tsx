import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { TwoColumn } from '../two-column.js';

describe('TwoColumn', () => {
  afterEach(() => cleanup());

  it('renders the main and aside slot nodes in their regions', () => {
    const { container } = render(
      <TwoColumn aside={<div data-testid="aside" />} main={<div data-testid="main" />} />,
    );
    expect(container.querySelector('.ui-two-column__main [data-testid="main"]')).not.toBeNull();
    expect(container.querySelector('.ui-two-column__aside [data-testid="aside"]')).not.toBeNull();
  });
});
