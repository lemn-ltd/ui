import type { HTMLAttributes, ReactElement, ReactNode } from 'react';
import { Tag } from '../../primitives/index.js';
import './recent-chips.css';

export interface RecentChipItem {
  readonly id: string;
  readonly label: ReactNode;
}

export interface RecentChipsProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'onSelect'> {
  readonly label: ReactNode;
  readonly items: readonly RecentChipItem[];
  readonly onSelect?: (id: string) => void;
}

/** A leading label followed by a row of muted `Tag` chips for recent items. */
export function RecentChips({
  label,
  items,
  onSelect,
  className,
  ...rest
}: RecentChipsProps): ReactElement {
  return (
    <div className={['ui-recent-chips', className].filter(Boolean).join(' ')} {...rest}>
      <span className="ui-recent-chips__label">{label}</span>
      <div className="ui-recent-chips__items">
        {items.map((item) => (
          <Tag
            className="ui-recent-chips__chip"
            key={item.id}
            onClick={onSelect ? () => onSelect(item.id) : undefined}
            variant="muted"
          >
            {item.label}
          </Tag>
        ))}
      </div>
    </div>
  );
}
