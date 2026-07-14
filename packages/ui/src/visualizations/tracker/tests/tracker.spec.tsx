import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Tracker } from '../tracker.js';

describe('Tracker', () => {
  afterEach(() => cleanup());

  it('announces every discrete state without relying on color', () => {
    const { getByText } = render(
      <Tracker aria-label="Run status" items={[{ label: 'Build', status: 'complete' }, { label: 'Deploy', status: 'error' }]} />,
    );
    expect(getByText(/Build: complete/)).toBeTruthy();
    expect(getByText(/Deploy: error/)).toBeTruthy();
  });
});
