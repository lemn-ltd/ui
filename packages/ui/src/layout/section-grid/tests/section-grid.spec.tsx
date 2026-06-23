import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { SectionGrid } from '../section-grid.js';

describe('SectionGrid', () => {
  afterEach(() => cleanup());

  it('renders the inner wrapper containing the children', () => {
    const { container } = render(
      <SectionGrid>
        <div data-testid="child" />
      </SectionGrid>,
    );
    const inner = container.querySelector('.ui-section-grid__inner');
    expect(inner).not.toBeNull();
    expect(inner?.querySelector('[data-testid="child"]')).not.toBeNull();
  });
});
