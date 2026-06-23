import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { RuntimeRefsPanel } from '../runtime-refs-panel.js';

describe('RuntimeRefsPanel', () => {
  afterEach(() => cleanup());

  it('renders one ref line and one metric tile per entry', () => {
    const { container } = render(
      <RuntimeRefsPanel
        metrics={[
          { label: 'Max turns', value: '8' },
          { label: 'Safety', value: 'enforced' },
        ]}
        refs={[
          { label: 'RuntimeSession', value: 'rsess_9f2a4c7e' },
          { label: 'RuntimeRun', value: 'rrun_71c4d8' },
        ]}
      />,
    );
    expect(container.querySelectorAll('.ui-runtime-refs-panel__ref')).toHaveLength(2);
    expect(container.querySelectorAll('.ui-runtime-refs-panel__metric')).toHaveLength(2);
    expect(container.textContent).toContain('rsess_9f2a4c7e');
    expect(container.textContent).toContain('enforced');
  });
});
