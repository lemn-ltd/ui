import type { ReactElement, ReactNode } from 'react';

export interface PropRow {
  readonly name: string;
  readonly type: string;
  readonly defaultValue?: string;
  readonly description: ReactNode;
}

export interface PropsTableProps {
  readonly rows: readonly PropRow[];
}

export function PropsTable({ rows }: PropsTableProps): ReactElement {
  return (
    <table className="showcase-props-table">
      <thead>
        <tr>
          <th>Prop</th>
          <th>Type</th>
          <th>Default</th>
          <th>Description</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.name}>
            <td className="showcase-props-table__name">{row.name}</td>
            <td className="showcase-props-table__type">{row.type}</td>
            <td className="showcase-props-table__default">{row.defaultValue ?? '—'}</td>
            <td>{row.description}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
