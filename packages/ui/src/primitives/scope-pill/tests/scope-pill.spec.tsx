import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { ScopePill } from '../scope-pill.js';

describe('ScopePill', () => {
  afterEach(() => cleanup());

  it('renders a span with the base className and children', () => {
    const { container } = render(<ScopePill>workspace</ScopePill>);
    const pill = container.querySelector('span.ui-scope-pill');
    expect(pill).not.toBeNull();
    expect(pill?.textContent).toBe('workspace');
  });
});
