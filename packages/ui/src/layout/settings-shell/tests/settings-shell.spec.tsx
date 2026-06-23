import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Dialog } from '../../../overlays/dialog/dialog.js';
import { type SettingsNavGroup, SettingsShell } from '../settings-shell.js';

const GROUPS: readonly SettingsNavGroup[] = [
  {
    header: 'General',
    items: [
      { id: 'general', label: 'General' },
      { id: 'account', label: 'Account' },
    ],
  },
  {
    header: 'Advanced',
    items: [
      { id: 'danger', label: 'Danger zone', disabled: true },
      { id: 'about', label: 'About' },
    ],
  },
];

function renderShell(props: Partial<Parameters<typeof SettingsShell>[0]> = {}) {
  return render(
    <SettingsShell groups={GROUPS} {...props}>
      {(active) => <div data-testid="detail">section:{active}</div>}
    </SettingsShell>,
  );
}

describe('SettingsShell', () => {
  afterEach(() => cleanup());

  it('renders grouped tabs and selects the first enabled section by default', () => {
    renderShell();

    expect(
      screen.getByText('General', { selector: '.ui-settings-shell__group-header' }),
    ).not.toBeNull();
    const general = screen.getByRole('tab', { name: 'General' });
    expect(general.getAttribute('aria-selected')).toBe('true');
    expect(general.getAttribute('tabindex')).toBe('0');
    expect(screen.getByTestId('detail').textContent).toBe('section:general');
  });

  it('skips a disabled leading item when choosing the default section', () => {
    render(
      <SettingsShell
        groups={[
          {
            items: [
              { id: 'first', label: 'First', disabled: true },
              { id: 'second', label: 'Second' },
            ],
          },
        ]}
      >
        {(active) => <span data-testid="detail">{active}</span>}
      </SettingsShell>,
    );
    expect(screen.getByTestId('detail').textContent).toBe('second');
    expect(screen.getByRole('tab', { name: 'First' }).hasAttribute('disabled')).toBe(true);
  });

  it('selects on click and swaps the detail body (uncontrolled)', () => {
    renderShell();
    fireEvent.click(screen.getByRole('tab', { name: 'About' }));
    expect(screen.getByRole('tab', { name: 'About' }).getAttribute('aria-selected')).toBe('true');
    expect(screen.getByTestId('detail').textContent).toBe('section:about');
  });

  it('routes selection through onSectionChange without self-updating when controlled', () => {
    const onSectionChange = vi.fn();
    const { rerender } = render(
      <SettingsShell activeSection="general" groups={GROUPS} onSectionChange={onSectionChange}>
        {(active) => <span data-testid="detail">{active}</span>}
      </SettingsShell>,
    );
    fireEvent.click(screen.getByRole('tab', { name: 'Account' }));
    expect(onSectionChange).toHaveBeenCalledWith('account');
    expect(screen.getByTestId('detail').textContent).toBe('general');

    rerender(
      <SettingsShell activeSection="account" groups={GROUPS} onSectionChange={onSectionChange}>
        {(active) => <span data-testid="detail">{active}</span>}
      </SettingsShell>,
    );
    expect(screen.getByTestId('detail').textContent).toBe('account');
  });

  it('moves the active section with ArrowDown/ArrowUp on the tab list', () => {
    renderShell();
    const list = screen.getByRole('tablist');
    fireEvent.keyDown(list, { key: 'ArrowDown' });
    expect(screen.getByRole('tab', { name: 'Account' }).getAttribute('aria-selected')).toBe('true');
    // 'Danger zone' is disabled and skipped, so ArrowDown lands on 'About'.
    fireEvent.keyDown(list, { key: 'ArrowDown' });
    expect(screen.getByRole('tab', { name: 'About' }).getAttribute('aria-selected')).toBe('true');
    fireEvent.keyDown(list, { key: 'Home' });
    expect(screen.getByRole('tab', { name: 'General' }).getAttribute('aria-selected')).toBe('true');
  });

  it('filters sections by the built-in search and shows the empty state', () => {
    renderShell();
    const search = screen.getByRole('searchbox', { name: 'Filter settings' });
    fireEvent.change(search, { target: { value: 'acc' } });
    expect(screen.queryByRole('tab', { name: 'General' })).toBeNull();
    expect(screen.getByRole('tab', { name: 'Account' })).not.toBeNull();

    fireEvent.change(search, { target: { value: 'zzz' } });
    expect(screen.getByText('No matching settings')).not.toBeNull();
  });

  it('hides the search field when searchable is false', () => {
    renderShell({ searchable: false });
    expect(screen.queryByRole('searchbox')).toBeNull();
  });

  it('does not render the navigation collapse control by default', () => {
    const { container } = renderShell();
    expect(screen.queryByRole('button', { name: 'Collapse settings navigation' })).toBeNull();
    expect(
      container.querySelector('.ui-settings-shell')?.hasAttribute('data-nav-collapsible'),
    ).toBe(false);
  });

  it('collapses and expands the navigation when enabled', () => {
    const { container } = renderShell({ collapsibleNav: true });
    const shell = container.querySelector('.ui-settings-shell');
    const nav = container.querySelector('.ui-settings-shell__nav');
    expect(shell?.getAttribute('data-nav-collapsed')).toBe('false');
    expect(
      container.querySelector('.ui-settings-shell__detail .ui-settings-shell__nav-toggle'),
    ).not.toBeNull();
    expect(
      container
        .querySelector('.ui-settings-shell__detail .ui-settings-shell__nav-toggle')
        ?.getAttribute('data-variant'),
    ).toBe('ghost-accent');

    fireEvent.click(screen.getByRole('button', { name: 'Collapse settings navigation' }));
    expect(shell?.getAttribute('data-nav-collapsed')).toBe('true');
    expect(nav?.getAttribute('aria-hidden')).toBe('true');
    expect(nav?.hasAttribute('inert')).toBe(true);
    expect(screen.queryByRole('tablist')).toBeNull();
    expect(screen.getByRole('button', { name: 'Expand settings navigation' })).not.toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Expand settings navigation' }));
    expect(shell?.getAttribute('data-nav-collapsed')).toBe('false');
    expect(nav?.hasAttribute('aria-hidden')).toBe(false);
    expect(nav?.hasAttribute('inert')).toBe(false);
  });

  it('can start with collapsed navigation when enabled', () => {
    const { container } = renderShell({ collapsibleNav: true, defaultNavCollapsed: true });
    expect(container.querySelector('.ui-settings-shell')?.getAttribute('data-nav-collapsed')).toBe(
      'true',
    );
    expect(screen.queryByRole('searchbox')).toBeNull();
    expect(screen.queryByRole('tablist')).toBeNull();
    expect(screen.getByRole('button', { name: 'Expand settings navigation' })).not.toBeNull();
  });

  it('routes navigation collapse through onNavCollapsedChange when controlled', () => {
    const onNavCollapsedChange = vi.fn();
    const { container, rerender } = render(
      <SettingsShell
        collapsibleNav
        groups={GROUPS}
        navCollapsed
        onNavCollapsedChange={onNavCollapsedChange}
      >
        {(active) => <span data-testid="detail">{active}</span>}
      </SettingsShell>,
    );
    const shell = container.querySelector('.ui-settings-shell');
    fireEvent.click(screen.getByRole('button', { name: 'Expand settings navigation' }));
    expect(onNavCollapsedChange).toHaveBeenCalledWith(false);
    expect(shell?.getAttribute('data-nav-collapsed')).toBe('true');

    rerender(
      <SettingsShell
        collapsibleNav
        groups={GROUPS}
        navCollapsed={false}
        onNavCollapsedChange={onNavCollapsedChange}
      >
        {(active) => <span data-testid="detail">{active}</span>}
      </SettingsShell>,
    );
    expect(shell?.getAttribute('data-nav-collapsed')).toBe('false');
  });

  it('honors a controlled search value', () => {
    const onSearchChange = vi.fn();
    renderShell({ searchValue: 'gen', onSearchChange });
    expect(screen.queryByRole('tab', { name: 'Account' })).toBeNull();
    expect(screen.getByRole('tab', { name: 'General' })).not.toBeNull();
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'about' } });
    expect(onSearchChange).toHaveBeenCalledWith('about');
  });

  it('renders a static detail body and sticky footer slots', () => {
    const { container } = render(
      <SettingsShell
        detailFooter={<button type="button">Save</button>}
        detailHeader={<span>Account</span>}
        groups={GROUPS}
      >
        <p>Static body</p>
      </SettingsShell>,
    );
    expect(container.querySelector('.ui-settings-shell__detail-content')?.textContent).toBe(
      'Static body',
    );
    expect(container.querySelector('.ui-settings-shell__detail-header')?.textContent).toBe(
      'Account',
    );
    expect(screen.getByRole('button', { name: 'Save' })).not.toBeNull();
  });

  it('appends the error summary to the end of the scrolling detail body', () => {
    const { container } = render(
      <SettingsShell
        detailFooter={<button type="button">Save</button>}
        error="Name is required."
        groups={GROUPS}
      >
        <p>Static body</p>
      </SettingsShell>,
    );
    const content = container.querySelector('.ui-settings-shell__detail-content');
    const banner = content?.querySelector('.ui-info-banner');
    expect(banner?.textContent).toContain('Name is required.');
    // The error follows the body content and stays out of the actions footer.
    expect(content?.lastElementChild).toBe(banner);
    const footer = container.querySelector('.ui-settings-shell__detail-footer');
    expect(footer?.querySelector('.ui-info-banner')).toBeNull();
    expect(footer?.textContent).toBe('Save');
  });

  it('renders the body error even without footer actions', () => {
    const { container } = render(
      <SettingsShell error="Something failed." groups={GROUPS}>
        <p>Static body</p>
      </SettingsShell>,
    );
    expect(
      container.querySelector('.ui-settings-shell__detail-content .ui-info-banner')?.textContent,
    ).toContain('Something failed.');
    expect(container.querySelector('.ui-settings-shell__detail-footer')).toBeNull();
  });

  it('presents as a focus-trapped modal with a close affordance', () => {
    render(
      <SettingsShell defaultOpen groups={GROUPS} title="Preferences">
        {(active) => <span>{active}</span>}
      </SettingsShell>,
    );
    expect(document.querySelector('.ui-settings-shell__modal')).not.toBeNull();
    expect(document.querySelector('.ui-settings-shell__title')?.textContent).toBe('Preferences');
    expect(document.querySelector('[aria-label="Close"]')).not.toBeNull();
  });

  it('keeps a parent dialog open when a stacked settings modal closes', () => {
    function Harness() {
      const [childOpen, setChildOpen] = useState(false);
      return (
        <Dialog defaultOpen title="Parent modal">
          <p>Parent content</p>
          <button onClick={() => setChildOpen(true)} type="button">
            Open child
          </button>
          <SettingsShell
            groups={GROUPS}
            modal
            onOpenChange={setChildOpen}
            open={childOpen}
            title="Child settings"
          >
            {(active) => <span>{active}</span>}
          </SettingsShell>
        </Dialog>
      );
    }

    render(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: 'Open child' }));

    expect(document.querySelectorAll('.ui-dialog')).toHaveLength(1);
    expect(document.querySelectorAll('.ui-settings-shell__modal')).toHaveLength(1);

    const closeButtons = screen.getAllByLabelText('Close');
    fireEvent.click(closeButtons[1] as Element);

    expect(document.querySelectorAll('.ui-settings-shell__modal')).toHaveLength(0);
    expect(document.querySelectorAll('.ui-dialog')).toHaveLength(1);
    expect(screen.getByText('Parent content')).not.toBeNull();
  });

  it('stays inline (no overlay) outside modal mode', () => {
    renderShell();
    expect(document.querySelector('.ui-settings-shell__modal')).toBeNull();
    expect(document.querySelector('.ui-settings-shell__overlay')).toBeNull();
  });
});
