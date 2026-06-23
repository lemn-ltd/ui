import { type HTMLAttributes, type ReactElement, type ReactNode, useState } from 'react';
import { JsonViewer } from '../../data-display/index.js';
import { InfoBanner, Spinner } from '../../feedback/index.js';
import { Icon, type IconName } from '../../primitives/index.js';
import type {
  AgentExecutionLadderStage,
  AgentToolCallPart,
  AgentToolCallStatus,
  AgentToolExecutionInfo,
  ToolOutputBlock,
} from './tool-call-part.js';
import './agent-tool-call-card.css';

export interface AgentToolCallCardProps extends HTMLAttributes<HTMLDivElement> {
  readonly toolCall: AgentToolCallPart;
  readonly defaultOpen?: boolean;
}

// Keyed by the status union: a new AgentToolCallStatus member fails the build
// until a label and icon are mapped.
const STATUS_LABEL: Record<AgentToolCallStatus, string> = {
  pending: 'Pending',
  running: 'Running',
  completed: 'Completed',
  error: 'Error',
  interrupted: 'Interrupted',
  confirming: 'Confirming',
  denied: 'Denied',
};

// Running uses the spinner instead of a glyph, so it is excluded here.
const STATUS_ICON: Record<Exclude<AgentToolCallStatus, 'running'>, IconName> = {
  pending: 'clock',
  completed: 'check-circle',
  error: 'triangle-alert',
  interrupted: 'square',
  confirming: 'user-check',
  denied: 'lock',
};

const EXECUTION_STAGES: readonly AgentExecutionLadderStage[] = [
  'workspace',
  'isolate',
  'npm',
  'browser',
  'sandbox',
];

export function AgentToolCallCard({
  toolCall,
  defaultOpen = false,
  className,
  ...rest
}: AgentToolCallCardProps): ReactElement {
  const [open, setOpen] = useState(defaultOpen);
  const { name, status, title } = toolCall;
  const duration = formatDuration(toolCall.time);
  const detailId = `tool-call-detail-${toolCall.id}`;

  return (
    <div
      className={['ui-agent-tool-call-card', className].filter(Boolean).join(' ')}
      data-tool-name={name}
      data-tool-status={status}
      {...rest}
    >
      <button
        aria-controls={detailId}
        aria-expanded={open}
        className="ui-agent-tool-call-card__row"
        onClick={() => setOpen((prev) => !prev)}
        type="button"
      >
        <Icon className="ui-agent-tool-call-card__chevron" name="chevron-right" size={16} />
        <span className="ui-agent-tool-call-card__name">{name}</span>
        <span className="ui-agent-tool-call-card__title">{title}</span>
        {duration ? <span className="ui-agent-tool-call-card__time">{duration}</span> : null}
        <StatusIndicator status={status} />
      </button>

      {open ? (
        <div className="ui-agent-tool-call-card__detail" id={detailId}>
          <ToolCallDetail toolCall={toolCall} />
        </div>
      ) : null}
    </div>
  );
}

function ToolCallDetail({ toolCall }: { readonly toolCall: AgentToolCallPart }): ReactElement {
  const { input, output, errorText, rule, reason, status } = toolCall;
  return (
    <>
      {toolCall.execution ? <ExecutionLadderView execution={toolCall.execution} /> : null}
      {input === undefined ? null : (
        <ToolCallField label="Input">
          <JsonViewer data={input} defaultExpanded />
        </ToolCallField>
      )}
      {output && output.length > 0 ? (
        <ToolCallField label="Output">
          {output.map((block, index) => (
            <ToolOutputBlockView block={block} key={`${block.kind}-${index}`} />
          ))}
        </ToolCallField>
      ) : null}
      <OptionalTextSection label="Error" tone="danger" value={errorText} />
      <OptionalTextSection label="Rule" value={rule} />
      <OptionalTextSection label="Reason" value={reason} />
      {status === 'pending' && input === undefined ? (
        <div className="ui-agent-tool-call-card__hint">No output yet — queued.</div>
      ) : null}
    </>
  );
}

function ExecutionLadderView({
  execution,
}: {
  readonly execution: AgentToolExecutionInfo;
}): ReactElement {
  const selectedIndex = EXECUTION_STAGES.indexOf(execution.selectedStage);
  const minimumIndex = EXECUTION_STAGES.indexOf(execution.minimumStage);

  return (
    <section
      aria-label={`Execution stage ${execution.selectedStage}`}
      className="ui-agent-tool-call-card__execution"
    >
      <div className="ui-agent-tool-call-card__execution-header">
        <p className="ui-agent-tool-call-card__label">Execution</p>
        <span
          className="ui-agent-tool-call-card__execution-decision"
          data-decision={execution.policyDecision}
        >
          {execution.policyDecision}
        </span>
      </div>
      <ol className="ui-agent-tool-call-card__execution-rail">
        {EXECUTION_STAGES.map((stage, index) => (
          <li
            className="ui-agent-tool-call-card__execution-stage"
            data-state={stageState(index, selectedIndex, minimumIndex)}
            key={stage}
          >
            <span className="ui-agent-tool-call-card__execution-dot" />
            <span className="ui-agent-tool-call-card__execution-label">{stage}</span>
          </li>
        ))}
      </ol>
      <dl className="ui-agent-tool-call-card__execution-meta">
        <ExecutionMeta label="provider" value={execution.providerKind} />
        <ExecutionMeta label="adapter" value={execution.adapterKind} />
        <ExecutionMeta label="ref" value={execution.environmentRef} />
      </dl>
      {execution.reason ? (
        <p className="ui-agent-tool-call-card__execution-reason">{execution.reason}</p>
      ) : null}
    </section>
  );
}

function ExecutionMeta({
  label,
  value,
}: {
  readonly label: string;
  readonly value?: string;
}): ReactElement | null {
  if (!value) return null;
  return (
    <div className="ui-agent-tool-call-card__execution-chip">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function stageState(
  index: number,
  selectedIndex: number,
  minimumIndex: number,
): 'selected' | 'minimum' | 'below' | 'above' {
  if (index === selectedIndex) return 'selected';
  if (index === minimumIndex) return 'minimum';
  return index < selectedIndex ? 'below' : 'above';
}

function OptionalTextSection({
  label,
  tone,
  value,
}: {
  readonly label: string;
  readonly tone?: 'danger';
  readonly value?: string;
}): ReactElement | null {
  if (!value) return null;
  if (tone === 'danger') {
    return (
      <section className="ui-agent-tool-call-card__section">
        <InfoBanner density="compact" variant="danger">
          {value}
        </InfoBanner>
      </section>
    );
  }
  return (
    <section className="ui-agent-tool-call-card__section">
      <p className="ui-agent-tool-call-card__label">{label}</p>
      <pre className="ui-agent-tool-call-card__mono">{value}</pre>
    </section>
  );
}

function StatusIndicator({ status }: { readonly status: AgentToolCallStatus }): ReactElement {
  const label = STATUS_LABEL[status];
  if (status === 'running') {
    return (
      <span className="ui-agent-tool-call-card__status-indicator" title={label}>
        <Spinner aria-label={label} className="ui-agent-tool-call-card__status-spinner" size="sm" />
      </span>
    );
  }

  return (
    <span
      aria-label={label}
      className="ui-agent-tool-call-card__status-indicator"
      role="img"
      title={label}
    >
      <Icon name={STATUS_ICON[status]} size={16} />
    </span>
  );
}

// Collapsible Input/Output field. Its chevron sits at the detail's left edge,
// which aligns with the group header's "N tool calls" text column.
function ToolCallField({
  label,
  children,
}: {
  readonly label: string;
  readonly children: ReactNode;
}): ReactElement {
  const [open, setOpen] = useState(false);
  return (
    <section className="ui-agent-tool-call-card__section">
      <button
        aria-expanded={open}
        className="ui-agent-tool-call-card__field-toggle"
        onClick={() => setOpen((prev) => !prev)}
        type="button"
      >
        <Icon className="ui-agent-tool-call-card__field-chevron" name="chevron-right" size={16} />
        <span className="ui-agent-tool-call-card__label">{label}</span>
      </button>
      {open ? <div className="ui-agent-tool-call-card__field-body">{children}</div> : null}
    </section>
  );
}

function ToolOutputBlockView({ block }: { readonly block: ToolOutputBlock }): ReactElement {
  if (block.kind === 'text') {
    return (
      <div className="ui-agent-tool-call-card__text-block">
        <pre className="ui-agent-tool-call-card__mono">{block.text}</pre>
        {block.truncation ? (
          <p className="ui-agent-tool-call-card__truncation">
            Truncated · {block.truncation.strategy} · {block.truncation.maxLines} lines
          </p>
        ) : null}
      </div>
    );
  }
  if (block.kind === 'image') {
    return (
      <img
        alt={`${block.mimeType} output`}
        className="ui-agent-tool-call-card__image"
        src={block.ref}
      />
    );
  }
  return <JsonViewer data={block.value} defaultExpanded />;
}

function formatDuration(time: AgentToolCallPart['time']): string | null {
  if (!time || time.start === undefined || time.end === undefined) return null;
  const seconds = (time.end - time.start) / 1000;
  if (!Number.isFinite(seconds) || seconds < 0) return null;
  return `${seconds.toFixed(2)}s`;
}
