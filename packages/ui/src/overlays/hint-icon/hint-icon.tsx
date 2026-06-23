import type { ReactElement } from 'react';
import { Icon, type IconName, type IconSize } from '../../primitives/index.js';
import { Tooltip, type TooltipPlacement, type TooltipTone } from '../tooltip/tooltip.js';
import './hint-icon.css';

export type HintIconTone = TooltipTone;

export interface HintIconProps {
  readonly label: string;
  readonly icon: IconName;
  readonly tone?: HintIconTone;
  readonly size?: IconSize;
  readonly placement?: TooltipPlacement;
}

/**
 * An inline glyph that reveals a toned {@link Tooltip} on hover or focus. The
 * `tone` tints both the glyph and the tooltip (`info` for an advisory note,
 * `warn` for a constraint, `danger`/`success` for state), so a single element
 * can flag something and explain it without spending a click. The tooltip wraps,
 * so the content may be a short sentence, not just a label.
 */
export function HintIcon({
  label,
  icon,
  tone = 'neutral',
  size = 14,
  placement = 'top',
}: HintIconProps): ReactElement {
  return (
    <Tooltip content={label} placement={placement} tone={tone}>
      <button aria-label={label} className="ui-hint-icon" data-tone={tone} type="button">
        <Icon name={icon} size={size} />
      </button>
    </Tooltip>
  );
}
