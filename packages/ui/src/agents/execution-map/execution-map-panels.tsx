import type { ReactNode } from 'react';
import { JsonViewer } from '../../data-display/index.js';
import { SegmentedControl } from '../../forms/index.js';
import { Tooltip, type TooltipPlacement } from '../../overlays/index.js';
import { Icon, type IconName, Input } from '../../primitives/index.js';
import type {
  ExecutionMapDetailMode,
  ExecutionMapTimelineBehavior,
} from './execution-map-state.js';
import {
  type ExecutionMapSearchResult,
  executionMapEdgeColor,
  executionMapEventVocabulary,
  executionMapShortId,
} from './model/execution-map-model.js';
import type {
  ExecutionMapEdge,
  ExecutionMapEntity,
  ExecutionMapEvent,
  ExecutionMapFocusMode,
} from './types.js';

export function FloatingBubble({
  children,
  icon,
  label,
  open,
  side = 'left',
  tooltip,
  tooltipPlacement,
  onOpen,
}: {
  readonly children: ReactNode;
  readonly icon: IconName;
  readonly label: string;
  readonly open: boolean;
  readonly side?: 'left' | 'bottom-left';
  readonly tooltip: ReactNode;
  readonly tooltipPlacement?: TooltipPlacement;
  readonly onOpen: () => void;
}) {
  const placement = tooltipPlacement ?? 'right';

  return (
    <section
      aria-label={label}
      className="ui-execution-map__floating-bubble"
      data-open={open ? 'true' : 'false'}
      data-side={side}
    >
      {open ? (
        <div className="ui-execution-map__bubble-panel">{children}</div>
      ) : (
        <Tooltip content={tooltip} placement={placement}>
          <button
            aria-label={label}
            className="ui-execution-map__bubble-toggle"
            type="button"
            onClick={onOpen}
          >
            <Icon name={icon} size={18} />
          </button>
        </Tooltip>
      )}
    </section>
  );
}

export function ViewportControls({
  fullscreen,
  onFit,
  onToggleFullscreen,
  onZoomIn,
  onZoomOut,
}: {
  readonly fullscreen: boolean;
  readonly onFit: () => void;
  readonly onToggleFullscreen: () => void;
  readonly onZoomIn: () => void;
  readonly onZoomOut: () => void;
}) {
  return (
    <section className="ui-execution-map__viewport-controls" aria-label="Map viewport controls">
      <Tooltip content="Zoom in." placement="left">
        <button
          aria-label="Zoom in"
          className="ui-execution-map__viewport-button"
          type="button"
          onClick={onZoomIn}
        >
          <Icon name="plus" size={18} />
        </button>
      </Tooltip>
      <Tooltip content="Zoom out." placement="left">
        <button
          aria-label="Zoom out"
          className="ui-execution-map__viewport-button"
          type="button"
          onClick={onZoomOut}
        >
          <Icon name="minus" size={18} />
        </button>
      </Tooltip>
      <Tooltip content="Fit the full execution map into view." placement="left">
        <button
          aria-label="Fit execution map"
          className="ui-execution-map__viewport-button"
          type="button"
          onClick={onFit}
        >
          <Icon name="maximize" size={18} />
        </button>
      </Tooltip>
      <Tooltip
        content={
          fullscreen ? 'Return the map to the page layout.' : 'Expand the map to fill the tab.'
        }
        placement="left"
      >
        <button
          aria-label={fullscreen ? 'Exit fullscreen map' : 'Fullscreen map'}
          aria-pressed={fullscreen}
          className="ui-execution-map__viewport-button"
          type="button"
          onClick={onToggleFullscreen}
        >
          <Icon name={fullscreen ? 'minimize-2' : 'maximize-2'} size={18} />
        </button>
      </Tooltip>
    </section>
  );
}

export function SearchPanel({
  open,
  query,
  results,
  onQueryChange,
  onSelectResult,
  onOpen,
}: {
  readonly open: boolean;
  readonly query: string;
  readonly results: readonly ExecutionMapSearchResult[];
  readonly onQueryChange: (query: string) => void;
  readonly onSelectResult: (result: ExecutionMapSearchResult) => void;
  readonly onOpen: () => void;
}) {
  return (
    <FloatingBubble
      icon="search"
      label="Search execution map"
      open={open}
      tooltip="Search nodes, events, statuses, IDs, tools, and edge kinds."
      onOpen={onOpen}
    >
      <section className="ui-execution-map__search-panel">
        <Input
          aria-label="Search execution map"
          placeholder="tool, hitl, delegates, status:running"
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.currentTarget.value)}
        />
        {query.trim() ? (
          <div className="ui-execution-map__search-results">
            {results.length > 0 ? (
              results.map((result) => (
                <button
                  key={`${result.kind}:${result.key}`}
                  type="button"
                  onClick={() => onSelectResult(result)}
                >
                  <span className="ui-execution-map__search-result-badge">{result.badge}</span>
                  <strong>{result.title}</strong>
                  <small>{result.subtitle}</small>
                </button>
              ))
            ) : (
              <p>No matches</p>
            )}
          </div>
        ) : (
          <div className="ui-execution-map__search-hints">
            <button type="button" onClick={() => onQueryChange('tool')}>
              tool
            </button>
            <button type="button" onClick={() => onQueryChange('hitl')}>
              hitl
            </button>
            <button type="button" onClick={() => onQueryChange('edge:delegates')}>
              edge:delegates
            </button>
            <button type="button" onClick={() => onQueryChange('status:running')}>
              status:running
            </button>
          </div>
        )}
      </section>
    </FloatingBubble>
  );
}

export function MapControlsPanel({
  detailMode,
  focusMode,
  open,
  timelineBehavior,
  onDetailModeChange,
  onFocusModeChange,
  onOpen,
  onTimelineBehaviorChange,
}: {
  readonly detailMode: ExecutionMapDetailMode;
  readonly focusMode: ExecutionMapFocusMode;
  readonly open: boolean;
  readonly timelineBehavior: ExecutionMapTimelineBehavior;
  readonly onDetailModeChange: (mode: ExecutionMapDetailMode) => void;
  readonly onFocusModeChange: (mode: ExecutionMapFocusMode) => void;
  readonly onOpen: () => void;
  readonly onTimelineBehaviorChange: (behavior: ExecutionMapTimelineBehavior) => void;
}) {
  return (
    <FloatingBubble
      icon="settings"
      label="Map controls"
      open={open}
      tooltip="Change graph focus and detail level."
      onOpen={onOpen}
    >
      <section className="ui-execution-map__control-panel">
        <div className="ui-execution-map__control-row">
          <span>Graph</span>
          <SegmentedControl
            aria-label="Graph focus"
            segments={[
              { value: 'focus', label: 'Focus' },
              { value: 'lineage', label: 'Lineage' },
              { value: 'all', label: 'All' },
            ]}
            value={focusMode}
            onValueChange={(value) => onFocusModeChange(value as ExecutionMapFocusMode)}
          />
        </div>
        <div className="ui-execution-map__control-row">
          <span>Detail</span>
          <SegmentedControl
            aria-label="Detail level"
            segments={[
              { value: 'overview', label: 'Overview' },
              { value: 'balanced', label: 'Balanced' },
              { value: 'detailed', label: 'Detailed' },
            ]}
            value={detailMode}
            onValueChange={(value) => onDetailModeChange(value as ExecutionMapDetailMode)}
          />
        </div>
        <div className="ui-execution-map__control-row">
          <span>Timeline</span>
          <SegmentedControl
            aria-label="Timeline behavior"
            segments={[
              { value: 'manual', label: 'Manual' },
              { value: 'node-click', label: 'Node click' },
            ]}
            value={timelineBehavior}
            onValueChange={(value) =>
              onTimelineBehaviorChange(value as ExecutionMapTimelineBehavior)
            }
          />
        </div>
      </section>
    </FloatingBubble>
  );
}

export function ExecutionLinksPanel({
  edges,
  open,
  selectedKind,
  onSelectKind,
  onOpen,
}: {
  readonly edges: readonly ExecutionMapEdge[];
  readonly open: boolean;
  readonly selectedKind: ExecutionMapEdge['edgeKind'] | null;
  readonly onSelectKind: (kind: ExecutionMapEdge['edgeKind']) => void;
  readonly onOpen: () => void;
}) {
  const counts = edges.reduce((accumulator, edge) => {
    accumulator.set(edge.edgeKind, (accumulator.get(edge.edgeKind) ?? 0) + 1);
    return accumulator;
  }, new Map<ExecutionMapEdge['edgeKind'], number>());
  const kinds = [...counts.keys()].sort();

  return (
    <FloatingBubble
      icon="plug"
      label="Execution links"
      open={open}
      tooltip="Filter the map by ownership, delegation, requests, and tool links."
      onOpen={onOpen}
    >
      <section className="ui-execution-map__links-body">
        <div>
          {kinds.map((kind) => (
            <button
              className="ui-execution-map__link-chip"
              data-active={selectedKind === kind ? 'true' : 'false'}
              key={kind}
              type="button"
              onClick={() => onSelectKind(kind)}
            >
              <span style={{ background: executionMapEdgeColor(kind) }} />
              <strong>{kind}</strong>
              <small>{counts.get(kind)}</small>
            </button>
          ))}
        </div>
      </section>
    </FloatingBubble>
  );
}

export function EventVocabularyPanel({
  open,
  onOpen,
}: {
  readonly open: boolean;
  readonly onOpen: () => void;
}) {
  return (
    <FloatingBubble
      icon="info"
      label="Event vocabulary"
      open={open}
      tooltip="Show the meaning of timeline event icons."
      onOpen={onOpen}
    >
      <section className="ui-execution-map__vocabulary-panel" aria-label="Event vocabulary">
        {executionMapEventVocabulary.map((entry) => (
          <article
            className="ui-execution-map__vocabulary-item"
            data-event-kind={entry.kind}
            key={entry.kind}
          >
            <span className="ui-execution-map__event-glyph">
              <Icon name={entry.iconName} size={16} />
            </span>
            <div>
              <strong>{entry.label}</strong>
              <small>{entry.description}</small>
            </div>
            <code>{entry.code}</code>
          </article>
        ))}
      </section>
    </FloatingBubble>
  );
}

export function FloatingInspector({
  open,
  selectedObject,
}: {
  readonly open: boolean;
  readonly selectedObject: ExecutionMapEntity | ExecutionMapEdge | ExecutionMapEvent | null;
}) {
  const title = selectionTitle(selectedObject);

  if (!open || !selectedObject) return null;

  return (
    <section
      aria-label="Inspector"
      className="ui-execution-map__floating-bubble ui-execution-map__inspector-shell"
      data-open="true"
    >
      <aside className="ui-execution-map__inspector">
        <header className="ui-execution-map__floating-head">
          <div>
            <p>Inspector</p>
            <h3>{title}</h3>
          </div>
        </header>
        <dl>
          {selectionRows(selectedObject).map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value ?? '-'}</dd>
            </div>
          ))}
        </dl>
        <JsonViewer data={selectedObject} defaultExpanded />
      </aside>
    </section>
  );
}

function selectionTitle(
  value: ExecutionMapEntity | ExecutionMapEdge | ExecutionMapEvent | null,
): string {
  if (!value) return 'Nothing selected';
  if ('entityKind' in value) return value.entityKind;
  if ('edgeKind' in value) return value.edgeKind;
  return value.eventType;
}

function selectionRows(
  value: ExecutionMapEntity | ExecutionMapEdge | ExecutionMapEvent | null,
): readonly [string, string | null][] {
  if (!value) return [];
  if ('entityKind' in value) {
    return [
      ['Status', value.status],
      ['Entity ID', executionMapShortId(value.entityId)],
      ['Agent', value.agentInstanceId ? executionMapShortId(value.agentInstanceId) : null],
      ['Attempt', value.attemptId ? executionMapShortId(value.attemptId) : null],
    ];
  }
  if ('edgeKind' in value) {
    return [
      ['Edge ID', executionMapShortId(value.edgeId)],
      ['From', `${value.from.entityKind}:${executionMapShortId(value.from.entityId)}`],
      ['To', `${value.to.entityKind}:${executionMapShortId(value.to.entityId)}`],
      ['Created', value.createdAt],
    ];
  }
  return [
    ['Event ID', executionMapShortId(value.eventId)],
    ['Family', value.eventFamily],
    ['Seq', String(value.persistence.eventSeq)],
    ['Attempt', value.scope.attemptId ? executionMapShortId(value.scope.attemptId) : null],
  ];
}
