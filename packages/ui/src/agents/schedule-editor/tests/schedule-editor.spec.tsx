import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { ScheduleEditor } from '../schedule-editor.js';

describe('ScheduleEditor', () => {
  afterEach(() => cleanup());

  it('renders an editable input by default', () => {
    const { container } = render(<ScheduleEditor expression="0 2 * * *" kind="cron" />);
    expect(container.querySelector('input.ui-schedule-editor__input')).not.toBeNull();
    expect(container.querySelector('.ui-schedule-editor__value')).toBeNull();
  });

  it('renders a monospace value instead of an input when read-only', () => {
    const { container } = render(
      <ScheduleEditor expression="0 2 * * *" kind="cron" readOnly status="scheduled" />,
    );
    expect(container.querySelector('input.ui-schedule-editor__input')).toBeNull();
    const value = container.querySelector('.ui-schedule-editor__value');
    expect(value?.textContent).toBe('0 2 * * *');
    expect(container.querySelector('.ui-schedule-editor__summary')?.textContent).toContain(
      'Scheduled',
    );
  });
});
