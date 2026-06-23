import { ToggleGroup as RadixToggleGroup } from 'radix-ui';
import type { ReactElement } from 'react';
import { Icon, type IconName } from '../../primitives/index.js';
import './segmented-control.css';

export interface SegmentedControlSegment {
  readonly value: string;
  readonly label: string;
  readonly icon?: IconName;
  readonly disabled?: boolean;
}

export interface SegmentedControlProps {
  readonly segments: readonly SegmentedControlSegment[];

  readonly value?: string;
  readonly defaultValue?: string;
  readonly onValueChange?: (value: string) => void;

  readonly disabled?: boolean;

  readonly 'aria-label'?: string;
  readonly className?: string;
}

/**
 * Single-select segmented control on a recessed track. The pressed segment rises
 * to a raised pill; selection is keyed off the Radix `[data-state="on"]` hook.
 */
export function SegmentedControl({
  segments,
  value,
  defaultValue,
  onValueChange,
  disabled,
  'aria-label': ariaLabel,
  className,
}: SegmentedControlProps): ReactElement {
  return (
    <RadixToggleGroup.Root
      aria-label={ariaLabel}
      className={['ui-segmented-control', className].filter(Boolean).join(' ')}
      disabled={disabled}
      // Single-select: re-pressing the active segment must not clear it, so the
      // empty-string change from a deselect is swallowed.
      onValueChange={(next) => {
        if (next) onValueChange?.(next);
      }}
      type="single"
      value={value}
      defaultValue={defaultValue}
    >
      {segments.map((segment) => (
        <RadixToggleGroup.Item
          className="ui-segmented-control__segment"
          disabled={segment.disabled}
          key={segment.value}
          value={segment.value}
        >
          {segment.icon ? <Icon name={segment.icon} size={14} /> : null}
          <span className="ui-segmented-control__label">{segment.label}</span>
        </RadixToggleGroup.Item>
      ))}
    </RadixToggleGroup.Root>
  );
}
