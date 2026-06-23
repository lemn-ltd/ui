import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SettingsRow } from '../settings-row.js';

describe('SettingsRow', () => {
  it('renders the label and control', () => {
    render(
      <SettingsRow label="Name">
        <span>Avery Quinn</span>
      </SettingsRow>,
    );

    expect(screen.getByText('Name')).toBeDefined();
    expect(screen.getByText('Avery Quinn')).toBeDefined();
  });

  it('renders the optional description and omits it when absent', () => {
    const { rerender } = render(
      <SettingsRow description="Your primary email address" label="Email">
        <span>avery@example.com</span>
      </SettingsRow>,
    );
    expect(screen.getByText('Your primary email address')).toBeDefined();

    rerender(
      <SettingsRow label="Email">
        <span>avery@example.com</span>
      </SettingsRow>,
    );
    expect(screen.queryByText('Your primary email address')).toBeNull();
  });

  it('forwards a custom className onto the row element', () => {
    const { container } = render(
      <SettingsRow className="dense" label="Theme">
        <span>System</span>
      </SettingsRow>,
    );
    expect(container.querySelector('.ui-settings-row.dense')).not.toBeNull();
  });
});
