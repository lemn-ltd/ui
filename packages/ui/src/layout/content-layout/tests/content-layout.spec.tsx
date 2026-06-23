import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { ContentLayout } from '../content-layout.js';

const here = dirname(fileURLToPath(import.meta.url));
const css = readFileSync(join(here, '..', 'content-layout.css'), 'utf8');

describe('ContentLayout', () => {
  afterEach(() => cleanup());

  it('has no data-bleed by default', () => {
    const { container } = render(
      <ContentLayout>
        <div data-testid="child" />
      </ContentLayout>,
    );
    expect(container.querySelector('.ui-content-layout')?.hasAttribute('data-bleed')).toBe(false);
  });

  it('sets data-bleed when bleed is enabled', () => {
    const { container } = render(
      <ContentLayout bleed>
        <div data-testid="child" />
      </ContentLayout>,
    );
    expect(container.querySelector('.ui-content-layout')?.getAttribute('data-bleed')).toBe('true');
  });

  it('renders children', () => {
    const { getByTestId } = render(
      <ContentLayout>
        <div data-testid="child" />
      </ContentLayout>,
    );
    expect(getByTestId('child')).not.toBeNull();
  });

  it('fills the parent scrollport for bottom-anchored floating children', () => {
    const rule = css.match(/\.ui-content-layout\s*{([^}]*)}/)?.[1];
    expect(rule).toBeTruthy();
    expect(rule).toContain('min-height: 100%');
  });
});
