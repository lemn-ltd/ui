import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { TopBar } from '../top-bar.js';

describe('TopBar', () => {
  afterEach(() => cleanup());

  it('renders a collapse toggle labelled for the expanded state', () => {
    const { container } = render(<TopBar onToggleSidebar={vi.fn()} sidebarMode="expanded" />);
    expect(
      container.querySelector('.ui-icon-button[aria-label="Collapse sidebar"]'),
    ).not.toBeNull();
  });

  it('renders a toggle labelled for the collapsed state', () => {
    const { container } = render(<TopBar onToggleSidebar={vi.fn()} sidebarMode="hidden" />);
    expect(container.querySelector('.ui-icon-button[aria-label="Expand sidebar"]')).not.toBeNull();
  });

  it('renders the breadcrumb and actions slot nodes when provided', () => {
    const { getByTestId } = render(
      <TopBar
        actions={<div data-testid="actions" />}
        breadcrumb={<div data-testid="breadcrumb" />}
      />,
    );
    expect(getByTestId('breadcrumb')).not.toBeNull();
    expect(getByTestId('actions')).not.toBeNull();
  });
});
