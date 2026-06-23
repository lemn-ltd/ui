import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { Stepper, type StepperStep } from '../stepper.js';

const STEPS: readonly StepperStep[] = [
  { label: 'Plan', status: 'completed' },
  { label: 'Build', status: 'active' },
  { label: 'Ship', status: 'upcoming' },
];

describe('Stepper', () => {
  afterEach(() => cleanup());

  it('maps each step status to data-status', () => {
    const { container } = render(<Stepper steps={STEPS} />);
    const stepNodes = Array.from(container.querySelectorAll('.ui-stepper__step'));
    expect(stepNodes.map((node) => node.getAttribute('data-status'))).toEqual([
      'completed',
      'active',
      'upcoming',
    ]);
  });

  it('renders a check svg for completed steps and the index for others', () => {
    const { container } = render(<Stepper steps={STEPS} />);
    const stepNodes = Array.from(container.querySelectorAll('.ui-stepper__step'));

    expect(stepNodes[0]?.querySelector('.ui-stepper__dot svg')).not.toBeNull();

    expect(stepNodes[1]?.querySelector('.ui-stepper__dot svg')).toBeNull();
    expect(stepNodes[1]?.querySelector('.ui-stepper__index')?.textContent).toBe('2');
    expect(stepNodes[2]?.querySelector('.ui-stepper__index')?.textContent).toBe('3');
  });

  it('renders one fewer connector than steps', () => {
    const { container } = render(<Stepper steps={STEPS} />);
    expect(container.querySelectorAll('.ui-stepper__connector')).toHaveLength(STEPS.length - 1);
  });
});
