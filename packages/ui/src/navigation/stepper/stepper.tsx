import { Fragment, type ReactElement, type ReactNode } from 'react';
import { Icon } from '../../primitives/index.js';
import './stepper.css';

export type StepStatus = 'completed' | 'active' | 'upcoming';

export interface StepperStep {
  readonly label: ReactNode;
  readonly status: StepStatus;
}

export interface StepperProps {
  readonly steps: readonly StepperStep[];
}

export function Stepper({ steps }: StepperProps): ReactElement {
  return (
    <ol className="ui-stepper">
      {steps.map((step, index) => {
        const key = `${index}`;
        return (
          <Fragment key={key}>
            {index > 0 ? (
              <li
                aria-hidden="true"
                className="ui-stepper__connector"
                data-complete={steps[index - 1]?.status === 'completed'}
              />
            ) : null}
            <li className="ui-stepper__step" data-status={step.status}>
              <span className="ui-stepper__dot">
                {step.status === 'completed' ? (
                  <Icon name="check" size={14} />
                ) : (
                  <span className="ui-stepper__index">{index + 1}</span>
                )}
              </span>
              <span className="ui-stepper__label">{step.label}</span>
            </li>
          </Fragment>
        );
      })}
    </ol>
  );
}
