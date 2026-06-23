import type { HTMLAttributes, ReactElement, ReactNode } from 'react';
import './two-column.css';

export interface TwoColumnProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  readonly main: ReactNode;
  readonly aside: ReactNode;
}

export function TwoColumn({ main, aside, className, ...rest }: TwoColumnProps): ReactElement {
  return (
    <div className={['ui-two-column', className].filter(Boolean).join(' ')} {...rest}>
      <div className="ui-two-column__main">{main}</div>
      <aside className="ui-two-column__aside">{aside}</aside>
    </div>
  );
}
