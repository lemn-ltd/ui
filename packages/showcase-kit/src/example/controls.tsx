import type { ReactElement, ReactNode } from 'react';

export interface ControlsProps {
  readonly children: ReactNode;
  readonly title?: string;
}

export function Controls({ children, title = 'Controls' }: ControlsProps): ReactElement {
  return (
    <div className="showcase-controls">
      <div className="showcase-controls__title">{title}</div>
      <div className="showcase-controls__body">{children}</div>
    </div>
  );
}

export interface ControlRowProps {
  readonly label: string;
  readonly children: ReactNode;
}

export function ControlRow({ label, children }: ControlRowProps): ReactElement {
  return (
    <div className="showcase-controls__row">
      <span className="showcase-controls__label">{label}</span>
      <span className="showcase-controls__control">{children}</span>
    </div>
  );
}
