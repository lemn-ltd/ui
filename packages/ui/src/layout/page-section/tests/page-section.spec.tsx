import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { PageSection } from '../page-section.js';

describe('PageSection', () => {
  afterEach(() => cleanup());

  it('renders the header with the title when title is provided', () => {
    const { container } = render(
      <PageSection title="Members">
        <div data-testid="body" />
      </PageSection>,
    );
    expect(container.querySelector('.ui-page-section__header')).not.toBeNull();
    expect(container.querySelector('.ui-page-section__title')?.textContent).toBe('Members');
  });

  it('renders the header when only caption or actions is provided', () => {
    const { container, unmount } = render(
      <PageSection caption="Manage access">
        <div data-testid="body" />
      </PageSection>,
    );
    expect(container.querySelector('.ui-page-section__header')).not.toBeNull();
    unmount();

    const { container: actionsContainer } = render(
      <PageSection actions={<button type="button">Add</button>}>
        <div data-testid="body" />
      </PageSection>,
    );
    expect(actionsContainer.querySelector('.ui-page-section__header')).not.toBeNull();
  });

  it('omits the header when title, caption and actions are all absent', () => {
    const { container } = render(
      <PageSection>
        <div data-testid="body" />
      </PageSection>,
    );
    expect(container.querySelector('.ui-page-section__header')).toBeNull();
  });

  it('always renders the body children', () => {
    const { getByTestId } = render(
      <PageSection>
        <div data-testid="body" />
      </PageSection>,
    );
    expect(getByTestId('body')).not.toBeNull();
  });
});
