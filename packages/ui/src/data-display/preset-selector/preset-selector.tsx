import type { ReactElement } from 'react';
import { Icon, IconButton } from '../../primitives/index.js';
import './preset-selector.css';

export interface PresetOption {
  readonly value: string;
  readonly label: string;
}

export interface PresetSelectorProps {
  readonly presets: readonly PresetOption[];
  readonly value: string;
  readonly onSelect: (value: string) => void;
  readonly onManage?: () => void;
  readonly manageLabel?: string;
  readonly label?: string;
  readonly className?: string;
}

/** Compact segmented control for picking a saved preset, plus an optional manage affordance. */
export function PresetSelector({
  presets,
  value,
  onSelect,
  onManage,
  manageLabel = 'Manage presets',
  label = 'Preset',
  className,
}: PresetSelectorProps): ReactElement {
  return (
    <div className={['ui-preset-selector', className].filter(Boolean).join(' ')}>
      {label ? <span className="ui-preset-selector__label">{label}</span> : null}
      <div className="ui-preset-selector__segments">
        {presets.map((preset) => (
          <button
            className="ui-preset-selector__segment"
            data-active={preset.value === value ? 'true' : 'false'}
            key={preset.value}
            onClick={() => onSelect(preset.value)}
            type="button"
          >
            {preset.label}
          </button>
        ))}
      </div>
      {onManage ? (
        <IconButton
          aria-label={manageLabel}
          className="ui-preset-selector__manage"
          onClick={onManage}
        >
          <Icon name="settings" size={16} />
        </IconButton>
      ) : null}
    </div>
  );
}
