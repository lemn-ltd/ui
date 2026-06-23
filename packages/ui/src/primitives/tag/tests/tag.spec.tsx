import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { Tag, type TagVariant } from '../tag.js';

const VARIANTS: TagVariant[] = ['default', 'accent', 'muted'];

describe('Tag', () => {
  afterEach(() => cleanup());

  it('defaults to the default variant and renders children', () => {
    const { container } = render(<Tag>typescript</Tag>);
    const tag = container.querySelector('.ui-tag');
    expect(tag?.getAttribute('data-variant')).toBe('default');
    expect(tag?.textContent).toBe('typescript');
  });

  it('maps every variant to data-variant', () => {
    for (const variant of VARIANTS) {
      const { container, unmount } = render(<Tag variant={variant}>label</Tag>);
      expect(container.querySelector('.ui-tag')?.getAttribute('data-variant')).toBe(variant);
      unmount();
    }
  });
});
