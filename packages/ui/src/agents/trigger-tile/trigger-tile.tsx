import type { HTMLAttributes, ReactElement } from 'react';
import { Badge, type BadgeTone, Icon, type IconName } from '../../primitives/index.js';
import './trigger-tile.css';

/** Whether a configured trigger is live, turned off, or in a failed delivery state. */
export type TriggerStatus = 'enabled' | 'disabled' | 'error';

export interface TriggerTileProps extends HTMLAttributes<HTMLDivElement> {
  /** Brand-neutral glyph for the trigger kind, chosen by the consumer. */
  readonly icon: IconName;
  readonly label: string;
  readonly description?: string;
  readonly status: TriggerStatus;
  /** Marks the tile as the active selection in an authoring surface. */
  readonly selected?: boolean;
}

const STATUS_TONE: Record<TriggerStatus, BadgeTone> = {
  enabled: 'success',
  disabled: 'dim',
  error: 'danger',
};

const STATUS_LABEL: Record<TriggerStatus, string> = {
  enabled: 'Enabled',
  disabled: 'Disabled',
  error: 'Error',
};

/**
 * A single trigger kind as a bordered tile: a leading glyph, a label and
 * optional description, and a trailing status pill. Presentational — selection
 * and activation are owned by the host; the tile only reflects `status` and
 * `selected`.
 */
export function TriggerTile({
  icon,
  label,
  description,
  status,
  selected = false,
  className,
  ...rest
}: TriggerTileProps): ReactElement {
  return (
    <div
      className={['ui-trigger-tile', className].filter(Boolean).join(' ')}
      data-selected={selected ? 'true' : 'false'}
      data-status={status}
      {...rest}
    >
      <Icon className="ui-trigger-tile__icon" name={icon} size={18} />
      <div className="ui-trigger-tile__text">
        <span className="ui-trigger-tile__label">{label}</span>
        {description ? <span className="ui-trigger-tile__description">{description}</span> : null}
      </div>
      <Badge showDot tone={STATUS_TONE[status]} variant="soft">
        {STATUS_LABEL[status]}
      </Badge>
    </div>
  );
}
