import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { VersionTag } from '../version-tag.js';

describe('VersionTag', () => {
  afterEach(() => cleanup());

  it('marks the collapsed state and renders the dot', () => {
    const { container } = render(<VersionTag collapsed env="staging" version="v1.2.3" />);
    const root = container.querySelector('.ui-version-tag');
    expect(root?.getAttribute('data-collapsed')).toBe('true');
    expect(container.querySelector('.ui-version-tag__dot')).not.toBeNull();
  });

  it('renders an env badge when expanded with an env', () => {
    const { container } = render(<VersionTag env="staging" version="v1.2.3" />);
    expect(container.querySelector('.ui-version-tag')?.getAttribute('data-collapsed')).toBe(
      'false',
    );
    const badge = container.querySelector('.ui-badge');
    expect(badge).not.toBeNull();
    expect(badge?.textContent).toBe('staging');
  });

  it('renders the version text', () => {
    const { container } = render(<VersionTag version="v1.2.3" />);
    expect(container.querySelector('.ui-version-tag__version')?.textContent).toBe('v1.2.3');
  });
});
