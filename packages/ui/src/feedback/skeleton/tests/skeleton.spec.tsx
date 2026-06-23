import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import {
  Skeleton,
  SkeletonCard,
  type SkeletonShape,
  SkeletonTableRows,
  SkeletonText,
} from '../skeleton.js';

const SHAPES: SkeletonShape[] = ['line', 'circle', 'rect'];

describe('Skeleton', () => {
  afterEach(() => cleanup());

  it('defaults to the line shape', () => {
    const { container } = render(<Skeleton />);
    expect(container.querySelector('.ui-skeleton')?.getAttribute('data-shape')).toBe('line');
  });

  it('maps each shape to data-shape', () => {
    for (const shape of SHAPES) {
      const { container, unmount } = render(<Skeleton shape={shape} />);
      expect(container.querySelector('.ui-skeleton')?.getAttribute('data-shape')).toBe(shape);
      unmount();
    }
  });

  it('renders three text lines', () => {
    const { container } = render(<SkeletonText />);
    expect(container.querySelectorAll('.ui-skeleton-text__line')).toHaveLength(3);
  });

  it('renders a media rect plus two text lines for the card', () => {
    const { container } = render(<SkeletonCard />);
    expect(container.querySelector('.ui-skeleton-card__media')?.getAttribute('data-shape')).toBe(
      'rect',
    );
    expect(container.querySelectorAll('.ui-skeleton-card__line')).toHaveLength(2);
  });

  it('renders eight table rows', () => {
    const { container } = render(<SkeletonTableRows />);
    expect(container.querySelectorAll('.ui-skeleton-table__row')).toHaveLength(8);
  });
});
