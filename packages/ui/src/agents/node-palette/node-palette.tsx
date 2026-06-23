import type { HTMLAttributes, ReactElement } from 'react';
import { Icon, type IconName } from '../../primitives/index.js';
import type { GraphNodeKind } from '../graph-node/graph-node.js';
import './node-palette.css';

export interface NodePaletteItem {
  readonly kind: GraphNodeKind;
  readonly label: string;
  readonly icon?: IconName;
}

export interface NodePaletteProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onSelect'> {
  readonly items: readonly NodePaletteItem[];
  readonly title?: string;
  readonly selectedKind?: GraphNodeKind;
  readonly onSelect?: (kind: GraphNodeKind) => void;
}

/**
 * The graph authoring palette: a titled, bordered column of node kinds the
 * operator can add to a graph. Presentational — each row is a button that
 * reports its kind through `onSelect`; the active kind is highlighted via
 * `selectedKind`.
 */
export function NodePalette({
  items,
  title = 'Node palette',
  selectedKind,
  onSelect,
  className,
  ...rest
}: NodePaletteProps): ReactElement {
  return (
    <div className={['ui-node-palette', className].filter(Boolean).join(' ')} {...rest}>
      <p className="ui-node-palette__title">{title}</p>
      <div className="ui-node-palette__list">
        {items.map((item) => (
          <button
            className="ui-node-palette__item"
            data-kind={item.kind}
            data-selected={item.kind === selectedKind ? 'true' : 'false'}
            key={item.kind}
            onClick={onSelect ? () => onSelect(item.kind) : undefined}
            type="button"
          >
            {item.icon ? (
              <Icon className="ui-node-palette__icon" name={item.icon} size={16} />
            ) : null}
            <span className="ui-node-palette__label">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
