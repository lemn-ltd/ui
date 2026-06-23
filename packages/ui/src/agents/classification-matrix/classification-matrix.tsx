import type { HTMLAttributes, ReactElement } from 'react';
import { Badge, type BadgeTone } from '../../primitives/badge/badge.js';
import { InputSelect, type InputSelectOption } from '../../primitives/input-select/input-select.js';
import './classification-matrix.css';

/**
 * UI-local mirror of the data sensitivity ladder. Presentational only: the
 * design system never imports the domain contract, so this union stays a copy
 * the editor reads and writes without coupling to the foundation.
 */
export type DataClassification = 'public' | 'internal' | 'confidential' | 'restricted';

/** UI-local mirror of how a classified value may enter model context. */
export type ModelContextPolicy = 'allow' | 'hash_only' | 'deny';

/**
 * UI-local mirror of a capability's data policy draft. The matrix edits this
 * shape in place and emits an immutable next value on every change.
 */
export interface DataPolicyDraft {
  readonly outputClassification: DataClassification;
  readonly fieldClassifications: Record<string, DataClassification>;
  readonly modelContextPolicy: ModelContextPolicy;
  readonly allowedSinkRefs: readonly string[];
}

export interface ClassificationMatrixProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> {
  readonly value: DataPolicyDraft;

  /** The output fields whose classification the matrix lets an operator set. */
  readonly fields: readonly string[];

  readonly onChange: (next: DataPolicyDraft) => void;

  /** Optional catalog of sink refs, surfaced as context beside the allowlist. */
  readonly availableSinks?: readonly string[];
}

const CLASSIFICATIONS: readonly DataClassification[] = [
  'public',
  'internal',
  'confidential',
  'restricted',
];

const CLASSIFICATION_TONE: Record<DataClassification, BadgeTone> = {
  public: 'dim',
  internal: 'info',
  confidential: 'warn',
  restricted: 'danger',
};

const CLASSIFICATION_OPTIONS: readonly InputSelectOption[] = CLASSIFICATIONS.map((value) => ({
  value,
  label: humanize(value),
}));

const MODEL_CONTEXT_OPTIONS: readonly InputSelectOption[] = (
  ['allow', 'hash_only', 'deny'] as const
).map((value) => ({ value, label: humanize(value) }));

function humanize(value: string): string {
  const text = value.replace(/_/g, ' ');
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Editor for a capability's `DataPolicyDraft`: the output classification, the
 * model-context policy, a per-field classification matrix, and the allowed sink
 * refs. Fully presentational and controlled — every edit produces an immutable
 * next value and tones the classification through the shared Badge palette so a
 * field's sensitivity reads the same here as on a capability chip.
 */
export function ClassificationMatrix({
  value,
  fields,
  onChange,
  availableSinks,
  className,
  ...rest
}: ClassificationMatrixProps): ReactElement {
  const onOutputChange = (next: string): void => {
    onChange({ ...value, outputClassification: next as DataClassification });
  };

  const onModelContextChange = (next: string): void => {
    onChange({ ...value, modelContextPolicy: next as ModelContextPolicy });
  };

  const onFieldChange = (field: string, next: string): void => {
    onChange({
      ...value,
      fieldClassifications: {
        ...value.fieldClassifications,
        [field]: next as DataClassification,
      },
    });
  };

  return (
    <div className={['ui-classification-matrix', className].filter(Boolean).join(' ')} {...rest}>
      <div className="ui-classification-matrix__top">
        <section className="ui-classification-matrix__section">
          <h3 className="ui-classification-matrix__heading">Output classification</h3>
          <InputSelect
            aria-label="Output classification"
            onValueChange={onOutputChange}
            options={CLASSIFICATION_OPTIONS}
            value={value.outputClassification}
          />
        </section>

        <section className="ui-classification-matrix__section">
          <h3 className="ui-classification-matrix__heading">Model context policy</h3>
          <InputSelect
            aria-label="Model context policy"
            onValueChange={onModelContextChange}
            options={MODEL_CONTEXT_OPTIONS}
            value={value.modelContextPolicy}
          />
        </section>
      </div>

      <section className="ui-classification-matrix__section">
        <h3 className="ui-classification-matrix__heading">Field classifications</h3>
        <div className="ui-classification-matrix__table">
          <div className="ui-classification-matrix__row" data-head="true">
            <span>Field</span>
            <span>Current</span>
            <span>Classification</span>
          </div>

          {fields.length > 0 ? (
            fields.map((field) => {
              const current = value.fieldClassifications[field] ?? 'internal';
              return (
                <div className="ui-classification-matrix__row" key={field}>
                  <span className="ui-classification-matrix__field" title={field}>
                    {field}
                  </span>
                  <span>
                    <Badge showDot tone={CLASSIFICATION_TONE[current]} variant="soft">
                      {humanize(current)}
                    </Badge>
                  </span>
                  <span>
                    <InputSelect
                      aria-label={`Classification for ${field}`}
                      onValueChange={(next) => onFieldChange(field, next)}
                      options={CLASSIFICATION_OPTIONS}
                      value={current}
                    />
                  </span>
                </div>
              );
            })
          ) : (
            <p className="ui-classification-matrix__empty">No output fields to classify.</p>
          )}
        </div>
      </section>

      <section className="ui-classification-matrix__section">
        <h3 className="ui-classification-matrix__heading">Allowed sink refs</h3>
        {value.allowedSinkRefs.length > 0 ? (
          <div className="ui-classification-matrix__sinks">
            {value.allowedSinkRefs.map((sink) => (
              <Badge key={sink} tone="neutral" variant="subtle">
                {sink}
              </Badge>
            ))}
          </div>
        ) : (
          <p className="ui-classification-matrix__empty">
            {availableSinks && availableSinks.length > 0
              ? `No sinks allowed yet (${availableSinks.length} available).`
              : 'No sinks allowed yet.'}
          </p>
        )}
      </section>
    </div>
  );
}
