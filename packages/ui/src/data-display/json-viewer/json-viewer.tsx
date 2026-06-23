import { type ReactElement, type ReactNode, useState } from 'react';
import { Icon } from '../../primitives/index.js';
import './json-viewer.css';

export interface JsonViewerProps {
  readonly data: unknown;
  readonly defaultExpanded?: boolean;
  readonly className?: string;
}

type JsonContainer = Record<string, unknown> | unknown[];

function isContainer(value: unknown): value is JsonContainer {
  return typeof value === 'object' && value !== null;
}

function Scalar({ value }: { readonly value: unknown }): ReactElement {
  if (typeof value === 'string') {
    return <span className="ui-json-viewer__string">"{value}"</span>;
  }
  if (typeof value === 'number') {
    return <span className="ui-json-viewer__number">{String(value)}</span>;
  }
  if (typeof value === 'boolean') {
    return <span className="ui-json-viewer__keyword">{String(value)}</span>;
  }
  return <span className="ui-json-viewer__keyword">null</span>;
}

interface NodeProps {
  readonly name?: string;
  readonly value: unknown;
  readonly defaultExpanded: boolean;
}

function JsonNode({ name, value, defaultExpanded }: NodeProps): ReactElement {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const key = name === undefined ? null : <span className="ui-json-viewer__key">"{name}"</span>;
  const colon = name === undefined ? null : <span className="ui-json-viewer__punct">: </span>;

  if (!isContainer(value)) {
    return (
      <div className="ui-json-viewer__row">
        {key}
        {colon}
        <Scalar value={value} />
      </div>
    );
  }

  const isArray = Array.isArray(value);
  const entries: readonly [string, unknown][] = isArray
    ? value.map((item, index) => [String(index), item])
    : Object.entries(value);
  const open = isArray ? '[' : '{';
  const close = isArray ? ']' : '}';

  return (
    <div className="ui-json-viewer__node" data-expanded={expanded ? 'true' : 'false'}>
      <button
        className="ui-json-viewer__toggle"
        onClick={() => setExpanded((prev) => !prev)}
        type="button"
      >
        <Icon
          className="ui-json-viewer__caret"
          name={expanded ? 'chevron-down' : 'chevron-right'}
          size={12}
        />
        {key}
        {colon}
        <span className="ui-json-viewer__punct">{open}</span>
        {expanded ? null : (
          <span className="ui-json-viewer__ellipsis">
            {entries.length} {close}
          </span>
        )}
      </button>
      {expanded ? (
        <div className="ui-json-viewer__children">
          {entries.map(([childName, childValue]) => (
            <JsonNode
              defaultExpanded={defaultExpanded}
              key={childName}
              name={isArray ? undefined : childName}
              value={childValue}
            />
          ))}
          <div className="ui-json-viewer__row ui-json-viewer__row--closing">
            <span className="ui-json-viewer__punct">{close}</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/** Monospace JSON tree with per-node collapse and key/string/number/punctuation tones. */
export function JsonViewer({
  data,
  defaultExpanded = true,
  className,
}: JsonViewerProps): ReactElement {
  const content: ReactNode = <JsonNode defaultExpanded={defaultExpanded} value={data} />;

  return <div className={['ui-json-viewer', className].filter(Boolean).join(' ')}>{content}</div>;
}
