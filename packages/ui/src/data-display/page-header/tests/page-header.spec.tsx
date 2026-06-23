import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { PageHeader } from '../page-header.js';

describe('PageHeader', () => {
  afterEach(() => cleanup());

  it('renders the title and collapses the subtitle and actions when absent', () => {
    const { container } = render(<PageHeader title="Sessions" />);
    expect(container.querySelector('.ui-page-header__title')?.textContent).toBe('Sessions');
    expect(container.querySelector('.ui-page-header__subtitle')).toBeNull();
    expect(container.querySelector('.ui-page-header__actions')).toBeNull();
  });

  it('renders the subtitle and actions slots when provided', () => {
    const { container } = render(
      <PageHeader
        actions={<button type="button">New</button>}
        subtitle="All runs"
        title="Sessions"
      />,
    );
    expect(container.querySelector('.ui-page-header__subtitle')?.textContent).toBe('All runs');
    expect(container.querySelector('.ui-page-header__actions')?.textContent).toBe('New');
  });

  it('renders a title accessory beside the heading', () => {
    const { container } = render(
      <PageHeader
        title="Integrations"
        titleAccessory={<button type="button">How is it built?</button>}
      />,
    );
    expect(container.querySelector('.ui-page-header__title')?.textContent).toBe('Integrations');
    expect(container.querySelector('.ui-page-header__title-accessory')?.textContent).toBe(
      'How is it built?',
    );
  });
});
