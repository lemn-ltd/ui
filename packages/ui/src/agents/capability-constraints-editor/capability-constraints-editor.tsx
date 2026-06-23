import type { ChangeEvent, HTMLAttributes, ReactElement } from 'react';
import { Field } from '../../forms/field/field.js';
import { Button } from '../../primitives/button/button.js';
import { Icon } from '../../primitives/icon/icon.js';
import { IconButton } from '../../primitives/icon-button/icon-button.js';
import { Input } from '../../primitives/input/input.js';
import { InputSelect } from '../../primitives/input-select/input-select.js';
import { Toggle } from '../../primitives/toggle/toggle.js';
import './capability-constraints-editor.css';

/** Risk ceiling levels, mirrored from the capability safety contract. */
export type CapabilityConstraintsRiskLevel = 'low' | 'medium' | 'high' | 'critical';

/**
 * UI-local mirror of the capability narrowing contract. This is a presentational
 * shape only: it does not import the domain type so the design system stays free
 * of foundation dependencies. Every numeric and list field is optional — an unset
 * field means "no constraint", never zero or an empty list.
 */
export interface CapabilityConstraints {
  readonly allowedHosts?: string[];
  readonly allowedParams?: string[];
  readonly allowedSinks?: string[];

  readonly maxRows?: number;
  readonly maxBytes?: number;
  readonly maxPageSize?: number;
  readonly timeoutMs?: number;

  readonly quotaPerWindow?: number;
  readonly budgetUsdMicros?: number;

  readonly riskCeiling?: CapabilityConstraintsRiskLevel;

  readonly requiresHitl?: boolean;
  readonly requiresHitlForExternalSink?: boolean;

  readonly redactionRules?: string[];
}

export interface CapabilityConstraintsEditorProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> {
  readonly value: CapabilityConstraints;
  readonly onChange: (next: CapabilityConstraints) => void;

  readonly disabled?: boolean;
}

const RISK_OPTIONS = [
  { value: '', label: 'No ceiling' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
] as const;

const NUMERIC_FIELDS = [
  { key: 'quotaPerWindow', label: 'Quota per window', placeholder: 'requests' },
  { key: 'budgetUsdMicros', label: 'Budget (USD micros)', placeholder: 'µUSD' },
  { key: 'maxRows', label: 'Max rows', placeholder: 'rows' },
  { key: 'maxBytes', label: 'Max bytes', placeholder: 'bytes' },
  { key: 'maxPageSize', label: 'Max page size', placeholder: 'items' },
  { key: 'timeoutMs', label: 'Timeout (ms)', placeholder: 'ms' },
] as const satisfies readonly {
  readonly key: keyof CapabilityConstraints;
  readonly label: string;
  readonly placeholder: string;
}[];

const LIST_FIELDS = [
  { key: 'allowedHosts', label: 'Allowed hosts', placeholder: 'api.example.com' },
  { key: 'allowedParams', label: 'Allowed params', placeholder: 'cursor' },
  { key: 'allowedSinks', label: 'Allowed sinks', placeholder: 'queue.outbound' },
  { key: 'redactionRules', label: 'Redaction rules', placeholder: 'email' },
] as const satisfies readonly {
  readonly key: keyof CapabilityConstraints;
  readonly label: string;
  readonly placeholder: string;
}[];

/**
 * Drop a key from the constraints record so an unset field reads as `undefined`
 * rather than `0`, `''`, or `[]`. Empty lists and blank numbers must omit the key.
 */
function withoutKey(
  value: CapabilityConstraints,
  key: keyof CapabilityConstraints,
): CapabilityConstraints {
  const next = { ...value };
  delete next[key];
  return next;
}

function setNumeric(
  value: CapabilityConstraints,
  key: keyof CapabilityConstraints,
  raw: string,
): CapabilityConstraints {
  const trimmed = raw.trim();
  if (trimmed === '') return withoutKey(value, key);
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) return withoutKey(value, key);
  return { ...value, [key]: parsed };
}

function setList(
  value: CapabilityConstraints,
  key: keyof CapabilityConstraints,
  list: readonly string[],
): CapabilityConstraints {
  const cleaned = list.map((item) => item.trim()).filter((item) => item.length > 0);
  if (cleaned.length === 0) return withoutKey(value, key);
  return { ...value, [key]: cleaned };
}

/**
 * Editor for `CapabilityConstraints` — the narrowing applied to a capability
 * surface (risk ceiling, approval gates, numeric limits, and allowlists). Fully
 * presentational and controlled: every edit produces an immutable next value, and
 * cleared fields are omitted from the record so consumers can treat absence as
 * "no constraint".
 */
export function CapabilityConstraintsEditor({
  value,
  onChange,
  disabled = false,
  className,
  ...rest
}: CapabilityConstraintsEditorProps): ReactElement {
  const fieldState = disabled ? 'disabled' : 'default';

  const onRiskChange = (next: string): void => {
    if (next === '') {
      onChange(withoutKey(value, 'riskCeiling'));
      return;
    }
    onChange({ ...value, riskCeiling: next as CapabilityConstraintsRiskLevel });
  };

  const onToggleChange = (
    key: 'requiresHitl' | 'requiresHitlForExternalSink',
    checked: boolean,
  ): void => {
    if (!checked) {
      onChange(withoutKey(value, key));
      return;
    }
    onChange({ ...value, [key]: true });
  };

  const onNumericChange = (
    key: keyof CapabilityConstraints,
    event: ChangeEvent<HTMLInputElement>,
  ): void => {
    onChange(setNumeric(value, key, event.target.value));
  };

  return (
    <div
      className={['ui-capability-constraints-editor', className].filter(Boolean).join(' ')}
      {...rest}
    >
      <section className="ui-capability-constraints-editor__section">
        <h3 className="ui-capability-constraints-editor__heading">Risk &amp; approval</h3>
        <div className="ui-capability-constraints-editor__grid">
          <Field label="Risk ceiling" state={fieldState}>
            {(control) => (
              <InputSelect
                aria-describedby={control['aria-describedby']}
                aria-invalid={control['aria-invalid']}
                disabled={control.disabled}
                id={control.id}
                onValueChange={onRiskChange}
                options={RISK_OPTIONS}
                placeholder="No ceiling"
                value={value.riskCeiling ?? ''}
              />
            )}
          </Field>

          <div className="ui-capability-constraints-editor__toggle-row">
            <Toggle
              checked={value.requiresHitl === true}
              disabled={disabled}
              id="ui-capability-constraints-editor-requires-hitl"
              onCheckedChange={(checked) => onToggleChange('requiresHitl', checked)}
            />
            <label
              className="ui-capability-constraints-editor__toggle-label"
              htmlFor="ui-capability-constraints-editor-requires-hitl"
            >
              Requires human approval
            </label>
          </div>

          <div className="ui-capability-constraints-editor__toggle-row">
            <Toggle
              checked={value.requiresHitlForExternalSink === true}
              disabled={disabled}
              id="ui-capability-constraints-editor-requires-hitl-external"
              onCheckedChange={(checked) => onToggleChange('requiresHitlForExternalSink', checked)}
            />
            <label
              className="ui-capability-constraints-editor__toggle-label"
              htmlFor="ui-capability-constraints-editor-requires-hitl-external"
            >
              Requires approval for external sink
            </label>
          </div>
        </div>
      </section>

      <section className="ui-capability-constraints-editor__section">
        <h3 className="ui-capability-constraints-editor__heading">Limits</h3>
        <div className="ui-capability-constraints-editor__grid">
          {NUMERIC_FIELDS.map((field) => (
            <Field key={field.key} label={field.label} state={fieldState}>
              {(control) => (
                <Input
                  aria-describedby={control['aria-describedby']}
                  disabled={control.disabled}
                  id={control.id}
                  inputMode="numeric"
                  invalid={control.invalid}
                  min={0}
                  onChange={(event) => onNumericChange(field.key, event)}
                  placeholder={field.placeholder}
                  type="number"
                  value={value[field.key] === undefined ? '' : String(value[field.key])}
                />
              )}
            </Field>
          ))}
        </div>
      </section>

      <section className="ui-capability-constraints-editor__section">
        <h3 className="ui-capability-constraints-editor__heading">Allowlists</h3>
        <div className="ui-capability-constraints-editor__lists">
          {LIST_FIELDS.map((field) => (
            <StringListField
              disabled={disabled}
              key={field.key}
              label={field.label}
              onChange={(list) => onChange(setList(value, field.key, list))}
              placeholder={field.placeholder}
              value={(value[field.key] as string[] | undefined) ?? []}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

interface StringListFieldProps {
  readonly label: string;
  readonly placeholder: string;
  readonly value: readonly string[];
  readonly onChange: (next: string[]) => void;
  readonly disabled: boolean;
}

/**
 * A minimal repeating string-list editor: one row per entry plus an add row.
 * It is local to this component because the design system has no general
 * string-list primitive and `KeyValueEditor` carries a value column this surface
 * does not need.
 */
function StringListField({
  label,
  placeholder,
  value,
  onChange,
  disabled,
}: StringListFieldProps): ReactElement {
  const updateAt = (index: number, next: string): void => {
    onChange(value.map((item, current) => (current === index ? next : item)));
  };

  const removeAt = (index: number): void => {
    onChange(value.filter((_, current) => current !== index));
  };

  const addRow = (): void => {
    onChange([...value, '']);
  };

  return (
    <fieldset className="ui-capability-constraints-editor__list" disabled={disabled}>
      <legend className="ui-capability-constraints-editor__list-legend">{label}</legend>

      {value.length > 0 ? (
        <div className="ui-capability-constraints-editor__list-rows">
          {value.map((entry, index) => (
            <div className="ui-capability-constraints-editor__list-row" key={index}>
              <Input
                aria-label={`${label} ${index + 1}`}
                disabled={disabled}
                onChange={(event) => updateAt(index, event.target.value)}
                placeholder={placeholder}
                value={entry}
              />
              <IconButton
                aria-label={`Remove ${label} ${index + 1}`}
                disabled={disabled}
                onClick={() => removeAt(index)}
                variant="ghost-danger"
              >
                <Icon name="trash-2" />
              </IconButton>
            </div>
          ))}
        </div>
      ) : (
        <p className="ui-capability-constraints-editor__list-empty">No entries yet.</p>
      )}

      <Button
        className="ui-capability-constraints-editor__list-add"
        disabled={disabled}
        onClick={addRow}
        variant="secondary"
      >
        <Icon name="plus" />
        Add entry
      </Button>
    </fieldset>
  );
}
