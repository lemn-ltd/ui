import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { TriggerTile } from '../trigger-tile.js';

describe('TriggerTile', () => {
  afterEach(() => cleanup());

  it('reflects status and selection on stable data attributes', () => {
    const { container } = render(
      <TriggerTile description="On push" icon="plug" label="Webhook" selected status="error" />,
    );
    const tile = container.querySelector('.ui-trigger-tile');
    expect(tile?.getAttribute('data-status')).toBe('error');
    expect(tile?.getAttribute('data-selected')).toBe('true');
    expect(tile?.textContent).toContain('Webhook');
    expect(tile?.textContent).toContain('On push');
    expect(tile?.textContent).toContain('Error');
  });

  it('omits the description node when none is given', () => {
    const { container } = render(<TriggerTile icon="code" label="API" status="enabled" />);
    expect(container.querySelector('.ui-trigger-tile__description')).toBeNull();
  });
});
