import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { Popover } from '../popover.js';

describe('Popover', () => {
  afterEach(() => cleanup());

  it('maps the placement to the Radix side on the open content', () => {
    render(
      <Popover defaultOpen placement="right" trigger={<button type="button">Open</button>}>
        <p>Body</p>
      </Popover>,
    );
    const content = document.querySelector('.ui-popover');
    expect(content).not.toBeNull();
    expect(content?.getAttribute('data-side')).toBe('right');
  });
});
