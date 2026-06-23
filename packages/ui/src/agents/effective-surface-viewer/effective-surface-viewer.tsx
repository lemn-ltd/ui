import type { HTMLAttributes, ReactElement } from 'react';
import { Card, EmptyState } from '../../data-display/index.js';
import { Badge, Icon, Meter } from '../../primitives/index.js';
import { CapabilityChip, type CapabilityRiskLevel } from '../capability-chip/capability-chip.js';
import './effective-surface-viewer.css';

/** Risk ceiling levels for an effective capability. */
export type RiskLevel = CapabilityRiskLevel;

/**
 * A capability as it appears in the caller's own effective surface — the
 * resolved, read-only view of what the principal can actually do, already
 * narrowed by policy. UI-local shape; carries no domain types.
 */
export interface EffectiveCapability {
  readonly capabilityRef: string;
  readonly name: string;
  readonly description?: string;

  readonly integrationId: string;
  readonly integrationName: string;

  readonly risk: RiskLevel;
  readonly requiresHitl: boolean;

  readonly quotaPerWindow?: number | null;
  readonly quotaRemaining?: number | null;

  readonly driftBlocked?: boolean;
}

export interface EffectiveSurfaceViewerProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'onSelect'> {
  readonly capabilities: readonly EffectiveCapability[];
  /** Optional read-only selection callback; the viewer never mutates capabilities. */
  readonly onSelect?: (capabilityRef: string) => void;
  /** Description shown in the empty state when there are no effective capabilities. */
  readonly emptyHint?: string;
}

interface IntegrationGroup {
  readonly integrationId: string;
  readonly integrationName: string;
  readonly capabilities: readonly EffectiveCapability[];
}

const DEFAULT_EMPTY_HINT = 'No integrations are available to you yet.';

const RISK_METER_TONE = {
  low: 'accent',
  medium: 'accent',
  high: 'warn',
  critical: 'danger',
} as const;

/** Groups capabilities by integration, preserving first-seen order. */
function groupByIntegration(
  capabilities: readonly EffectiveCapability[],
): readonly IntegrationGroup[] {
  const order: string[] = [];
  const byId = new Map<string, EffectiveCapability[]>();

  for (const capability of capabilities) {
    const existing = byId.get(capability.integrationId);
    if (existing) {
      existing.push(capability);
    } else {
      order.push(capability.integrationId);
      byId.set(capability.integrationId, [capability]);
    }
  }

  return order.map((integrationId) => {
    const items = byId.get(integrationId) ?? [];
    return {
      integrationId,
      integrationName: items[0]?.integrationName ?? integrationId,
      capabilities: items,
    };
  });
}

/**
 * The consumption "My Integrations" view: a read-only surface that shows only
 * the caller's effective capabilities, grouped by integration. Each capability
 * states its risk ceiling, whether approval is required, remaining quota, and
 * whether drift has blocked it pending re-approval. It composes existing
 * primitives — `CapabilityChip`, `Meter`, `Card`, `EmptyState` — and adds no
 * mutation surface beyond the optional `onSelect`.
 */
export function EffectiveSurfaceViewer({
  capabilities,
  onSelect,
  emptyHint,
  className,
  ...rest
}: EffectiveSurfaceViewerProps): ReactElement {
  const groups = groupByIntegration(capabilities);

  return (
    <div className={['ui-effective-surface-viewer', className].filter(Boolean).join(' ')} {...rest}>
      {groups.length === 0 ? (
        <EmptyState
          className="ui-effective-surface-viewer__empty"
          description={emptyHint ?? DEFAULT_EMPTY_HINT}
          icon="plug"
          intent="first-run"
          title="No effective capabilities"
        />
      ) : (
        groups.map((group) => (
          <section className="ui-effective-surface-viewer__group" key={group.integrationId}>
            <header className="ui-effective-surface-viewer__group-header">
              <Icon name="plug" size={16} />
              <span className="ui-effective-surface-viewer__group-name">
                {group.integrationName}
              </span>
              <span className="ui-effective-surface-viewer__group-count">
                {group.capabilities.length}
              </span>
            </header>

            <div className="ui-effective-surface-viewer__rows">
              {group.capabilities.map((capability) => (
                <CapabilityRow
                  capability={capability}
                  key={capability.capabilityRef}
                  onSelect={onSelect}
                />
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}

interface CapabilityRowProps {
  readonly capability: EffectiveCapability;
  readonly onSelect?: (capabilityRef: string) => void;
}

function CapabilityRow({ capability, onSelect }: CapabilityRowProps): ReactElement {
  const blocked = capability.driftBlocked === true;
  const hasQuota = capability.quotaPerWindow != null;
  const max = capability.quotaPerWindow ?? 0;
  const remaining = capability.quotaRemaining ?? 0;
  const used = Math.max(0, max - remaining);

  const selectable = typeof onSelect === 'function';
  const handleSelect = selectable ? () => onSelect?.(capability.capabilityRef) : undefined;

  return (
    <Card
      className="ui-effective-surface-viewer__card"
      data-blocked={blocked ? 'true' : 'false'}
      data-selectable={selectable ? 'true' : 'false'}
      interactive={selectable}
      onClick={handleSelect}
    >
      <div className="ui-effective-surface-viewer__row">
        <div className="ui-effective-surface-viewer__main">
          <span className="ui-effective-surface-viewer__name">{capability.name}</span>
          {capability.description ? (
            <span className="ui-effective-surface-viewer__description">
              {capability.description}
            </span>
          ) : null}
        </div>

        <div className="ui-effective-surface-viewer__signals">
          <CapabilityChip kind="risk" value={capability.risk} />
          {capability.requiresHitl ? (
            <Badge className="ui-effective-surface-viewer__hitl" tone="warn" variant="soft">
              <Icon name="lock" size={12} />
              Approval required
            </Badge>
          ) : null}
        </div>
      </div>

      {hasQuota ? (
        <Meter
          className="ui-effective-surface-viewer__quota"
          label="Quota"
          max={max > 0 ? max : 1}
          tone={RISK_METER_TONE[capability.risk]}
          value={used}
        />
      ) : null}

      {blocked ? (
        <div className="ui-effective-surface-viewer__drift">
          <CapabilityChip kind="drift" value="blocked" />
          <span className="ui-effective-surface-viewer__drift-text">
            Unavailable — pending re-approval
          </span>
        </div>
      ) : null}
    </Card>
  );
}
