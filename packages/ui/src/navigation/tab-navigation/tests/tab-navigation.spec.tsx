import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { TabNavigation } from '../tab-navigation.js';

describe('TabNavigation', () => {
  afterEach(cleanup);

  it('uses real links and marks only the current URL', () => {
    const { getByRole } = render(
      <TabNavigation
        aria-label="Project sections"
        currentHref="/activity"
        items={[
          { href: '/overview', label: 'Overview' },
          { href: '/activity', label: 'Activity', count: 8 },
        ]}
      />,
    );
    expect(getByRole('navigation', { name: 'Project sections' })).toBeTruthy();
    expect(getByRole('link', { name: /Activity/ }).getAttribute('aria-current')).toBe('page');
    expect(getByRole('link', { name: 'Overview' }).getAttribute('href')).toBe('/overview');
  });

  it('removes navigation from disabled items', () => {
    const { getByText } = render(
      <TabNavigation
        aria-label="Sections"
        items={[{ href: '/billing', label: 'Billing', disabled: true }]}
      />,
    );
    expect(getByText('Billing').closest('a')?.getAttribute('href')).toBeNull();
    expect(getByText('Billing').closest('a')?.getAttribute('aria-disabled')).toBe('true');
  });
});
