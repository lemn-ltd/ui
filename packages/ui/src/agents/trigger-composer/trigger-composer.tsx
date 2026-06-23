import { type ReactElement, useState } from 'react';
import { Icon, IconButton, type IconName } from '../../primitives/index.js';
import type { ScheduleTriggerValue } from './describe-schedule.js';
import { ScheduleTriggerCard } from './schedule-trigger-card.js';
import './trigger-composer.css';

export {
  describeSchedule,
  type SchedulePreset,
  type ScheduleTriggerValue,
  type ScheduleWeekday,
} from './describe-schedule.js';

/** A schedule trigger, rendered as the deep preset builder card. */
export interface ScheduleComposerTrigger {
  readonly id: string;
  readonly kind: 'schedule';
  readonly value: ScheduleTriggerValue;
  /** A timezone gloss appended to the summary, e.g. `GMT+4`. */
  readonly timezoneLabel?: string;
}

/** A non-schedule trigger, rendered as a simple titled card (an API call, a repository event, …). */
export interface GenericComposerTrigger {
  readonly id: string;
  readonly kind: 'generic';
  readonly icon: IconName;
  readonly label: string;
  readonly description?: string;
}

export type ComposerTrigger = ScheduleComposerTrigger | GenericComposerTrigger;

/** A trigger kind offered in the "add another trigger" list. */
export interface AddableTrigger {
  /** Opaque key handed back to `onAddTrigger`. */
  readonly kind: string;
  readonly icon: IconName;
  readonly label: string;
  readonly description?: string;

  readonly disabled?: boolean;
  /** Why the option is unavailable, shown in place of an affordance, e.g. `Select a repository first`. */
  readonly disabledReason?: string;
}

export interface TriggerComposerProps {
  readonly triggers: readonly ComposerTrigger[];
  readonly onScheduleChange?: (id: string, value: ScheduleTriggerValue) => void;
  readonly onRemoveTrigger?: (id: string) => void;

  readonly addableTriggers?: readonly AddableTrigger[];
  readonly onAddTrigger?: (kind: string) => void;

  /** Section label above the trigger list. */
  readonly label?: string;

  readonly disabled?: boolean;
  readonly className?: string;
}

/**
 * The trigger authoring surface: a list of configured triggers — each a deep
 * schedule builder or a titled card — plus a collapsible "add another trigger"
 * picker. Controlled; the host owns the `triggers` list and reacts to the change
 * callbacks. Only the picker's open state is local.
 */
export function TriggerComposer({
  triggers,
  onScheduleChange,
  onRemoveTrigger,
  addableTriggers = [],
  onAddTrigger,
  label = 'Select a trigger',
  disabled = false,
  className,
}: TriggerComposerProps): ReactElement {
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <section
      className={['ui-trigger-composer', className].filter(Boolean).join(' ')}
      data-disabled={disabled ? 'true' : 'false'}
    >
      <p className="ui-trigger-composer__label">{label}</p>

      <div className="ui-trigger-composer__list">
        {triggers.map((trigger) =>
          trigger.kind === 'schedule' ? (
            <ScheduleTriggerCard
              disabled={disabled}
              key={trigger.id}
              onRemove={onRemoveTrigger ? () => onRemoveTrigger(trigger.id) : undefined}
              onValueChange={(value) => onScheduleChange?.(trigger.id, value)}
              timezoneLabel={trigger.timezoneLabel}
              value={trigger.value}
            />
          ) : (
            <div
              className="ui-trigger-composer__card"
              data-disabled={disabled ? 'true' : 'false'}
              key={trigger.id}
            >
              <header className="ui-trigger-composer__card-head">
                <Icon className="ui-trigger-composer__card-icon" name={trigger.icon} size={18} />
                <div className="ui-trigger-composer__card-text">
                  <span className="ui-trigger-composer__card-title">{trigger.label}</span>
                  {trigger.description ? (
                    <span className="ui-trigger-composer__card-sub">{trigger.description}</span>
                  ) : null}
                </div>
                {onRemoveTrigger ? (
                  <IconButton
                    aria-label={`Remove ${trigger.label}`}
                    className="ui-trigger-composer__card-remove"
                    disabled={disabled}
                    onClick={() => onRemoveTrigger(trigger.id)}
                    variant="ghost"
                  >
                    <Icon name="x" size={16} />
                  </IconButton>
                ) : null}
              </header>
            </div>
          ),
        )}
      </div>

      {addableTriggers.length > 0 ? (
        <div className="ui-trigger-composer__add">
          <button
            aria-expanded={pickerOpen}
            className="ui-trigger-composer__add-toggle"
            disabled={disabled}
            onClick={() => setPickerOpen((open) => !open)}
            type="button"
          >
            <Icon name={pickerOpen ? 'chevron-down' : 'chevron-right'} size={16} />
            <span>Add another trigger</span>
          </button>

          {pickerOpen ? (
            <div className="ui-trigger-composer__add-list">
              {addableTriggers.map((option) => (
                <button
                  className="ui-trigger-composer__add-option"
                  data-disabled={option.disabled ? 'true' : 'false'}
                  disabled={disabled || option.disabled}
                  key={option.kind}
                  onClick={() => onAddTrigger?.(option.kind)}
                  type="button"
                >
                  <Icon className="ui-trigger-composer__card-icon" name={option.icon} size={18} />
                  <div className="ui-trigger-composer__card-text">
                    <span className="ui-trigger-composer__card-title">{option.label}</span>
                    {option.description ? (
                      <span className="ui-trigger-composer__card-sub">{option.description}</span>
                    ) : null}
                  </div>
                  {option.disabled && option.disabledReason ? (
                    <span className="ui-trigger-composer__add-reason">{option.disabledReason}</span>
                  ) : null}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
