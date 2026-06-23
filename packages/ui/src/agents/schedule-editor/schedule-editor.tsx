import type { ReactElement } from 'react';
import { DescriptionList, DescriptionRow } from '../../data-display/index.js';
import { Field, SegmentedControl } from '../../forms/index.js';
import { Badge, type BadgeTone, Icon, Input } from '../../primitives/index.js';
import './schedule-editor.css';

/** How a schedule is expressed: a cron string, a repeating interval, or a fixed instant. */
export type ScheduleKind = 'cron' | 'interval' | 'fixed';

/** Whether the schedule is armed, currently due, or paused. */
export type ScheduleStatus = 'scheduled' | 'due' | 'paused';

export interface ScheduleEditorProps {
  readonly kind: ScheduleKind;
  readonly onKindChange?: (kind: ScheduleKind) => void;

  /** The schedule expression for the active kind (cron string, ISO duration, or instant). */
  readonly expression: string;
  readonly onExpressionChange?: (value: string) => void;
  /** A humanized gloss for the expression, e.g. `daily 02:00 UTC`. */
  readonly expressionHint?: string;

  readonly timezone?: string;

  readonly status?: ScheduleStatus;
  readonly nextRunLabel?: string;
  readonly lastRunLabel?: string;

  /** Renders the expression as a read-only monospace value instead of an input. */
  readonly readOnly?: boolean;
  readonly disabled?: boolean;
  readonly className?: string;
}

const KIND_SEGMENTS = [
  { value: 'cron', label: 'Cron' },
  { value: 'interval', label: 'Interval' },
  { value: 'fixed', label: 'Fixed' },
] as const;

const EXPRESSION_LABEL: Record<ScheduleKind, string> = {
  cron: 'Cron expression',
  interval: 'Interval',
  fixed: 'Run at',
};

const STATUS_TONE: Record<ScheduleStatus, BadgeTone> = {
  scheduled: 'info',
  due: 'warn',
  paused: 'dim',
};

const STATUS_LABEL: Record<ScheduleStatus, string> = {
  scheduled: 'Scheduled',
  due: 'Due',
  paused: 'Paused',
};

/**
 * A presentational schedule configuration block: a kind selector, the
 * expression (editable input or read-only monospace value), an optional
 * timezone, and a live next/last-run summary with a status pill. Controlled —
 * the host owns `kind`/`expression` and reacts to the change callbacks.
 */
export function ScheduleEditor({
  kind,
  onKindChange,
  expression,
  onExpressionChange,
  expressionHint,
  timezone,
  status,
  nextRunLabel,
  lastRunLabel,
  readOnly = false,
  disabled = false,
  className,
}: ScheduleEditorProps): ReactElement {
  const summaryParts = [
    nextRunLabel ? `Next run ${nextRunLabel}` : null,
    lastRunLabel ? `Last run ${lastRunLabel}` : null,
  ].filter(Boolean);

  return (
    <div
      className={['ui-schedule-editor', className].filter(Boolean).join(' ')}
      data-disabled={disabled ? 'true' : 'false'}
    >
      <SegmentedControl
        aria-label="Schedule kind"
        disabled={disabled}
        onValueChange={(value) => onKindChange?.(value as ScheduleKind)}
        segments={KIND_SEGMENTS.map((segment) => ({ ...segment }))}
        value={kind}
      />

      <Field
        hint={expressionHint}
        label={EXPRESSION_LABEL[kind]}
        state={disabled ? 'disabled' : 'default'}
      >
        {(control) =>
          readOnly ? (
            <code className="ui-schedule-editor__value" id={control.id}>
              {expression}
            </code>
          ) : (
            <Input
              {...control}
              className="ui-schedule-editor__input"
              onChange={(event) => onExpressionChange?.(event.target.value)}
              spellCheck={false}
              value={expression}
            />
          )
        }
      </Field>

      {timezone ? (
        <DescriptionList className="ui-schedule-editor__meta">
          <DescriptionRow label="Timezone">{timezone}</DescriptionRow>
        </DescriptionList>
      ) : null}

      {summaryParts.length > 0 || status ? (
        <div className="ui-schedule-editor__summary">
          <Icon className="ui-schedule-editor__summary-icon" name="clock" size={18} />
          <span className="ui-schedule-editor__summary-text">{summaryParts.join(' · ')}</span>
          {status ? (
            <Badge showDot tone={STATUS_TONE[status]} variant="soft">
              {STATUS_LABEL[status]}
            </Badge>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
