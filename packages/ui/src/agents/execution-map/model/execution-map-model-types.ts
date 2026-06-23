import type { IconName } from '../../../primitives/index.js';
import type { ExecutionMapEntityKind, ExecutionMapFocusMode } from '../types.js';

export type ExecutionMapNodeVisualState = 'selected' | 'path' | 'related' | 'dim' | 'neutral';
export type ExecutionMapEdgeVisualState = 'selected' | 'path' | 'related' | 'dim' | 'neutral';
export type ExecutionMapEventDisplayKind =
  | 'error'
  | 'delegation'
  | 'hitl'
  | 'tool'
  | 'inference'
  | 'attempt'
  | 'work'
  | 'input'
  | 'usage'
  | 'completed'
  | 'event';

export interface ExecutionMapLaneDefinition {
  readonly id: string;
  readonly name: string;
  readonly icon: string;
  readonly kinds: readonly ExecutionMapEntityKind[];
}

export interface ExecutionMapActorRowFrame {
  readonly actorKey: string;
  readonly label: string;
  readonly subtitle: string;
  readonly y: number;
  readonly height: number;
  readonly count: number;
}

export interface ExecutionMapLaneLayout {
  readonly positions: ReadonlyMap<string, { readonly x: number; readonly y: number }>;
  readonly rowFrames: readonly ExecutionMapActorRowFrame[];
  readonly canvasWidth: number;
  readonly canvasHeight: number;
}

export interface ExecutionMapFocusProjection {
  readonly mode: ExecutionMapFocusMode;
  readonly selectedTargetKey: string | null;
  readonly selectedEdgeId: string | null;
  readonly activeNodeKeys: ReadonlySet<string>;
  readonly relatedNodeKeys: ReadonlySet<string>;
  readonly pathNodeKeys: ReadonlySet<string>;
  readonly activeEdgeIds: ReadonlySet<string>;
  readonly pathEdgeIds: ReadonlySet<string>;
  readonly activeActorKeys: ReadonlySet<string>;
  readonly activeLaneIds: ReadonlySet<string>;
}

export interface ExecutionMapSearchResult {
  readonly kind: 'node' | 'edge' | 'event';
  readonly key: string;
  readonly title: string;
  readonly subtitle: string;
  readonly badge: string;
}

export interface ExecutionMapEventDisplay {
  readonly kind: ExecutionMapEventDisplayKind;
  readonly code: string;
  readonly label: string;
  readonly iconName: IconName;
  readonly description: string;
}

export const DEFAULT_EXECUTION_MAP_EVENT_DISPLAY: ExecutionMapEventDisplay = {
  kind: 'event',
  code: 'EV',
  label: 'Event',
  iconName: 'radio',
  description: 'Generic runtime evidence event.',
};

export const executionMapLaneDefinitions: readonly ExecutionMapLaneDefinition[] = [
  { id: 'agent', name: 'Agent', icon: 'AI', kinds: ['agent_instance'] },
  {
    id: 'input',
    name: 'Input / Communication',
    icon: 'IN',
    kinds: ['runtime_input', 'agent_communication'],
  },
  { id: 'work', name: 'Work', icon: 'WK', kinds: ['runtime_run'] },
  {
    id: 'attempt',
    name: 'Attempt / Native',
    icon: 'AT',
    kinds: ['attempt', 'child_run', 'attempt_result'],
  },
  { id: 'turn', name: 'Turn', icon: 'TR', kinds: ['turn'] },
  {
    id: 'tooling',
    name: 'Inference / Tool',
    icon: 'TOOL',
    kinds: ['inference_run', 'tool_call', 'tool_call_execution'],
  },
  {
    id: 'evidence',
    name: 'Events / Usage',
    icon: 'EV',
    kinds: ['runtime_event', 'usage_summary', 'hitl_request'],
  },
];

export const executionMapEventVocabulary: readonly ExecutionMapEventDisplay[] = [
  {
    kind: 'error',
    code: 'ERR',
    label: 'Error',
    iconName: 'triangle-alert',
    description: 'Failure, cancellation, or runtime error evidence.',
  },
  {
    kind: 'input',
    code: 'IN',
    label: 'Input',
    iconName: 'corner-down-left',
    description: 'User, runtime, or agent communication input entering the session.',
  },
  {
    kind: 'attempt',
    code: 'AT',
    label: 'Attempt',
    iconName: 'play',
    description: 'Agent execution attempt lifecycle evidence.',
  },
  {
    kind: 'tool',
    code: 'TOOL',
    label: 'Tool',
    iconName: 'wrench',
    description: 'Tool call or tool execution evidence.',
  },
  {
    kind: 'inference',
    code: 'LLM',
    label: 'Inference',
    iconName: 'code',
    description: 'Model inference run evidence.',
  },
  {
    kind: 'work',
    code: 'WK',
    label: 'Work',
    iconName: 'file-text',
    description: 'Runtime run scheduling or ownership evidence.',
  },
  {
    kind: 'delegation',
    code: 'DLG',
    label: 'Delegation',
    iconName: 'users',
    description: 'Work delegated across agent boundaries.',
  },
  {
    kind: 'hitl',
    code: 'HITL',
    label: 'Human review',
    iconName: 'user-check',
    description: 'Human-in-the-loop request or response evidence.',
  },
  {
    kind: 'usage',
    code: 'USG',
    label: 'Usage',
    iconName: 'list',
    description: 'Token, cost, metering, or usage summary evidence.',
  },
  {
    kind: 'completed',
    code: 'OK',
    label: 'Completed',
    iconName: 'check-circle',
    description: 'Completion evidence without a more specific category.',
  },
  DEFAULT_EXECUTION_MAP_EVENT_DISPLAY,
];

export const DEFAULT_EXECUTION_MAP_LANE: ExecutionMapLaneDefinition =
  executionMapLaneDefinitions[0] ?? {
    id: 'agent',
    name: 'Agent',
    icon: 'AI',
    kinds: ['agent_instance'],
  };
