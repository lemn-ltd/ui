import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { Icon, iconNames } from '../icon.js';

const EXCLUDED_DOMAIN_GLYPHS = [
  'automation',
  'webhook',
  'bot',
  'git-pull-request',
  'git-branch',
  'circle-play',
  'inbox',
  'book-marked',
  'hexagon',
  'layers',
  'zap',
  'archive',
  'list-checks',
  'terminal',
];

describe('Icon', () => {
  afterEach(() => cleanup());

  it('exposes exactly the product-neutral base set', () => {
    expect(iconNames).toEqual([
      'search',
      'x',
      'check',
      'check-circle',
      'chevron-down',
      'chevron-right',
      'chevron-up',
      'plus',
      'minus',
      'ellipsis',
      'eye',
      'lock',
      'info',
      'alert',
      'triangle-alert',
      'refresh',
      'rotate-ccw',
      'settings',
      'user-check',
      'external-link',
      'copy',
      'trash-2',
      'panel-left-close',
      'panel-left-open',
      'log-out',
      'maximize',
      'maximize-2',
      'minimize',
      'zoom-in',
      'zoom-out',
      'list',
      'layout-grid',
      'file',
      'folder',
      'clock',
      'arrow-left',
      'arrow-right',
      'arrow-up',
      'corner-down-left',
      'grip-vertical',
      'pointer',
      'pencil',
      'square',
      'square-pen',
      'play',
      'pause',
      'radio',
      'plug',
      'users',
      'wrench',
      'sun',
      'moon',
      'menu',
      'monitor',
      'code',
      'file-text',
      'minimize-2',
      'panel-right-close',
      'panel-right-open',
    ]);
  });

  it('excludes every domain glyph', () => {
    for (const glyph of EXCLUDED_DOMAIN_GLYPHS) {
      expect(iconNames).not.toContain(glyph);
    }
  });

  it('renders an svg sized via data-size', () => {
    const { container } = render(<Icon name="search" size={20} />);
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('data-size')).toBe('20');
    expect(svg?.getAttribute('aria-hidden')).toBe('true');
    expect(svg?.getAttribute('width')).toBe('20');
  });
});
