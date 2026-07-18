import type { StepperStep } from '@lemn-ltd/ui';

/** 5 steps: 2 completed, 1 active, 2 upcoming. */
export const steps: readonly StepperStep[] = [
  { label: 'Details', status: 'completed' },
  { label: 'Access', status: 'completed' },
  { label: 'Review', status: 'active' },
  { label: 'Confirm', status: 'upcoming' },
  { label: 'Done', status: 'upcoming' },
];
