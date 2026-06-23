import type { HTMLAttributes, ReactElement } from 'react';
import { Badge, type BadgeTone, type BadgeVariant } from '../../primitives/index.js';
import './capability-chip.css';

/** Risk ceiling levels, mirrored from the capability safety contract. */
export type CapabilityRiskLevel = 'low' | 'medium' | 'high' | 'critical';

/** Drift states a capability surface can be in, mirrored from the catalog contract. */
export type CapabilityDriftState =
  | 'approved'
  | 'blocked'
  | 'added'
  | 'removed'
  | 'surface_changed'
  | 'endpoint_changed'
  | 'oauth_scope_changed'
  | 'credential_changed'
  | 'credential_revoked'
  | 'db_role_changed'
  | 'db_schema_changed'
  | 'view_or_procedure_changed'
  | 'webhook_key_changed';

/** Policy decision effects, mirrored from the capability decision contract. */
export type CapabilityDecisionEffect = 'allow' | 'deny' | 'ask' | 'fail';

export type CapabilityChipKind = 'risk' | 'drift' | 'decision';

type ChipValue = {
  readonly risk: CapabilityRiskLevel;
  readonly drift: CapabilityDriftState;
  readonly decision: CapabilityDecisionEffect;
};

type KindValue = {
  [K in CapabilityChipKind]: { readonly kind: K; readonly value: ChipValue[K] };
}[CapabilityChipKind];

export type CapabilityChipProps = KindValue & {
  /** Override the humanized label. */
  readonly label?: string;
  readonly variant?: BadgeVariant;
} & Omit<HTMLAttributes<HTMLSpanElement>, 'children'>;

const RISK_TONE: Record<CapabilityRiskLevel, BadgeTone> = {
  low: 'dim',
  medium: 'info',
  high: 'warn',
  critical: 'danger',
};

const DECISION_TONE: Record<CapabilityDecisionEffect, BadgeTone> = {
  allow: 'success',
  ask: 'warn',
  deny: 'danger',
  fail: 'neutral',
};

const DRIFT_TONE: Record<CapabilityDriftState, BadgeTone> = {
  approved: 'success',
  blocked: 'danger',
  credential_revoked: 'danger',
  added: 'info',
  removed: 'dim',
  surface_changed: 'warn',
  endpoint_changed: 'warn',
  oauth_scope_changed: 'warn',
  credential_changed: 'warn',
  db_role_changed: 'warn',
  db_schema_changed: 'warn',
  view_or_procedure_changed: 'warn',
  webhook_key_changed: 'warn',
};

function humanize(value: string): string {
  const text = value.replace(/_/g, ' ');
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function resolveTone(props: KindValue): BadgeTone {
  if (props.kind === 'risk') return RISK_TONE[props.value];
  if (props.kind === 'decision') return DECISION_TONE[props.value];
  return DRIFT_TONE[props.value];
}

/**
 * Semantic chip for capability governance state. One component, three lenses
 * (risk ceiling, surface drift, policy decision), each mapped to a neutral tone
 * so risk/drift/decision read consistently across the admin and consumption planes.
 */
export function CapabilityChip(props: CapabilityChipProps): ReactElement {
  const { kind, value, label, variant = 'soft', className, ...rest } = props;
  const tone = resolveTone({ kind, value } as KindValue);
  return (
    <Badge
      className={['ui-capability-chip', className].filter(Boolean).join(' ')}
      data-capability-chip={kind}
      data-value={value}
      showDot
      tone={tone}
      variant={variant}
      {...rest}
    >
      {label ?? humanize(value)}
    </Badge>
  );
}
