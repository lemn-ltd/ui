import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { InfoBanner, type InfoBannerVariant } from '../info-banner.js';

const VARIANT_GLYPH: Record<InfoBannerVariant, string> = {
  info: 'lucide-info',
  warn: 'lucide-circle-alert',
  danger: 'lucide-circle-alert',
  success: 'lucide-check',
};

const here = dirname(fileURLToPath(import.meta.url));
const css = readFileSync(join(here, '..', 'info-banner.css'), 'utf8');

describe('InfoBanner', () => {
  afterEach(() => cleanup());

  it('defaults to the info variant', () => {
    const { container } = render(<InfoBanner>Body</InfoBanner>);
    const banner = container.querySelector('.ui-info-banner');
    expect(banner?.getAttribute('data-variant')).toBe('info');
    expect(banner?.getAttribute('data-density')).toBe('default');
  });

  it('maps each variant to data-variant and its contract glyph', () => {
    for (const variant of Object.keys(VARIANT_GLYPH) as InfoBannerVariant[]) {
      const { container, unmount } = render(<InfoBanner variant={variant}>Body</InfoBanner>);
      const banner = container.querySelector('.ui-info-banner');
      expect(banner?.getAttribute('data-variant')).toBe(variant);
      expect(
        banner?.querySelector(`.ui-info-banner__icon.${VARIANT_GLYPH[variant]}`),
      ).not.toBeNull();
      unmount();
    }
  });

  it('renders the children body slot', () => {
    const { container } = render(<InfoBanner>Heads up</InfoBanner>);
    expect(container.querySelector('.ui-info-banner__body')?.textContent).toBe('Heads up');
  });

  it('supports compact density for row-level messages', () => {
    const { container } = render(
      <InfoBanner density="compact" variant="danger">
        Fetch failed
      </InfoBanner>,
    );
    const banner = container.querySelector('.ui-info-banner');
    expect(banner?.getAttribute('data-density')).toBe('compact');
    expect(banner?.querySelector('.ui-info-banner__icon')?.getAttribute('width')).toBe('12');
  });

  it('stays a plain region without a live role when inline', () => {
    const { container } = render(<InfoBanner variant="danger">Body</InfoBanner>);
    const banner = container.querySelector('.ui-info-banner');
    expect(banner?.getAttribute('data-floating')).toBeNull();
    expect(banner?.getAttribute('role')).toBeNull();
  });

  it('floats as an alert for danger', () => {
    const { container } = render(
      <InfoBanner floating variant="danger">
        Service unavailable
      </InfoBanner>,
    );
    const banner = container.querySelector('.ui-info-banner');
    expect(banner?.getAttribute('data-floating')).toBe('true');
    expect(banner?.getAttribute('role')).toBe('alert');
  });

  it('floats as a status region for non-danger variants', () => {
    const { container } = render(
      <InfoBanner floating variant="warn">
        Heads up
      </InfoBanner>,
    );
    expect(container.querySelector('.ui-info-banner')?.getAttribute('role')).toBe('status');
  });

  it('anchors floating banners to the bottom of flex-backed scroll regions', () => {
    const rule = css.match(/\.ui-info-banner\[data-floating="true"\]\s*{([^}]*)}/)?.[1];
    expect(rule).toBeTruthy();
    expect(rule).toContain('position: sticky');
    expect(rule).toContain('bottom: calc(var(--lemn-space-3) + env(safe-area-inset-bottom, 0px))');
    expect(rule).toContain('margin-top: auto');
    expect(rule).toContain('flex-shrink: 0');
  });

  it('keeps compact banners small enough for inline rows', () => {
    const rule = css.match(/\.ui-info-banner\[data-density="compact"\]\s*{([^}]*)}/)?.[1];
    expect(rule).toBeTruthy();
    expect(rule).toContain('box-sizing: border-box');
    expect(rule).toContain('width: fit-content');
    expect(rule).toContain('padding: var(--lemn-space-1) var(--lemn-space-2)');
    expect(rule).toContain('border-radius: var(--lemn-radius-small)');
  });

  it('allows compact body text to wrap inside the available width', () => {
    const rule = css.match(
      /\.ui-info-banner\[data-density="compact"\]\s+\.ui-info-banner__body\s*{([^}]*)}/,
    )?.[1];
    expect(rule).toBeTruthy();
    expect(rule).toContain('overflow-wrap: anywhere');
    expect(rule).toContain('font-size: 11px');
    expect(rule).toContain('line-height: 14px');
  });

  it('renders a labelled region with title, custom content, and actions', () => {
    const { getByRole } = render(
      <InfoBanner actions={<button type="button">Retry</button>} title="Sync failed">
        Check your connection.
      </InfoBanner>,
    );
    const region = getByRole('region', { name: 'Sync failed' });
    expect(region.textContent).toContain('Check your connection.');
    expect(getByRole('button', { name: 'Retry' })).toBeTruthy();
  });

  it('supports explicit urgency without tying alerts to color', () => {
    const { getByRole } = render(
      <InfoBanner urgency="assertive" variant="info">
        Session expired
      </InfoBanner>,
    );
    expect(getByRole('alert').textContent).toContain('Session expired');
  });

  it('dismisses only when declared and reports the action', () => {
    const onDismiss = vi.fn();
    const { getByRole, queryByText } = render(
      <InfoBanner dismissible onDismiss={onDismiss}>
        Temporary notice
      </InfoBanner>,
    );
    fireEvent.click(getByRole('button', { name: 'Dismiss' }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(queryByText('Temporary notice')).toBeNull();
  });
});
