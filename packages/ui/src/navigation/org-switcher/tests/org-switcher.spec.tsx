import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { type OrgItem, OrgSwitcher, type OrgSwitcherVariant } from '../org-switcher.js';

const ORGS: readonly OrgItem[] = [
  { id: 'acme', name: 'Acme', mark: <span>A</span> },
  { id: 'globex', name: 'Globex', mark: <span>G</span> },
];

describe('OrgSwitcher', () => {
  afterEach(() => cleanup());

  it('maps every variant to data-variant', () => {
    const variants: OrgSwitcherVariant[] = ['expanded', 'rail'];
    for (const variant of variants) {
      const { container, unmount } = render(
        <OrgSwitcher currentOrgId="acme" orgs={ORGS} variant={variant} />,
      );
      expect(container.querySelector('.ui-org-switcher')?.getAttribute('data-variant')).toBe(
        variant,
      );
      unmount();
    }
  });

  it('shows the current org name in the expanded variant', () => {
    const { container } = render(
      <OrgSwitcher currentOrgId="globex" orgs={ORGS} variant="expanded" />,
    );
    expect(container.querySelector('.ui-org-switcher__name')?.textContent).toBe('Globex');
  });

  it('opens the menu on trigger pointer activation and renders the org rows', () => {
    render(<OrgSwitcher currentOrgId="acme" orgs={ORGS} variant="expanded" />);
    const trigger = document.querySelector('.ui-org-switcher');
    expect(trigger).not.toBeNull();

    // Radix DropdownMenu opens on a primary-button pointerdown, not a click.
    fireEvent.pointerDown(trigger as Element, { button: 0, ctrlKey: false });

    expect(trigger?.getAttribute('data-open')).toBe('true');
    const items = Array.from(document.querySelectorAll('.ui-menu__item'));
    expect(items).toHaveLength(2);
    const labels = items.map((item) => item.querySelector('.ui-menu__label')?.textContent);
    expect(labels).toEqual(['Acme', 'Globex']);
  });

  it('marks the selected org with a tinted row and no check glyph', () => {
    const onSelect = vi.fn();
    render(
      <OrgSwitcher
        activeOrgAction={{ label: 'Open org settings', onSelect }}
        currentOrgId="acme"
        orgs={ORGS}
        variant="expanded"
      />,
    );
    fireEvent.pointerDown(document.querySelector('.ui-org-switcher') as Element, {
      button: 0,
      ctrlKey: false,
    });

    // Selection is the tinted row, not a trailing check.
    expect(document.querySelectorAll('.ui-org-switcher__active-row')).toHaveLength(1);
    expect(document.querySelector('.ui-menu__trailing')).toBeNull();

    // The active-org action lives inside the selected row.
    const action = document.querySelector(
      '.ui-org-switcher__active-row .ui-org-switcher__active-action',
    );
    expect(action).not.toBeNull();

    fireEvent.click(action as Element);

    expect(onSelect).toHaveBeenCalledWith('acme');
  });

  it('tints the selected row even without an active-org action', () => {
    render(<OrgSwitcher currentOrgId="globex" orgs={ORGS} variant="expanded" />);
    fireEvent.pointerDown(document.querySelector('.ui-org-switcher') as Element, {
      button: 0,
      ctrlKey: false,
    });

    const rows = document.querySelectorAll('.ui-org-switcher__active-row');
    expect(rows).toHaveLength(1);
    expect(rows[0]?.querySelector('.ui-menu__label')?.textContent).toBe('Globex');
    expect(document.querySelector('.ui-org-switcher__active-action')).toBeNull();
  });
});
