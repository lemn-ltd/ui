import type { HTMLAttributes, ReactElement } from 'react';
import './section-grid.css';

export type SectionGridProps = HTMLAttributes<HTMLDivElement>;

export function SectionGrid({ className, children, ...rest }: SectionGridProps): ReactElement {
  return (
    <div className={['ui-section-grid', className].filter(Boolean).join(' ')} {...rest}>
      <div className="ui-section-grid__inner">{children}</div>
    </div>
  );
}
