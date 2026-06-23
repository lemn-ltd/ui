import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { ListShell } from '../list-shell.js';

describe('ListShell', () => {
  afterEach(() => cleanup());

  it('renders injected children inside the shell container', () => {
    const { container } = render(
      <ListShell>
        <p>child</p>
      </ListShell>,
    );
    const shell = container.querySelector('.ui-list-shell');
    expect(shell).not.toBeNull();
    expect(shell?.querySelector('p')?.textContent).toBe('child');
  });
});
