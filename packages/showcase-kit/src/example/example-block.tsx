import { Tabs } from '@appranks/ui';
import { type ReactElement, useState } from 'react';

export interface ExampleBlockProps {
  readonly render: () => ReactElement;
  readonly code: string;
}

type ExampleView = 'preview' | 'code';

export function ExampleBlock({ render, code }: ExampleBlockProps): ReactElement {
  const [view, setView] = useState<ExampleView>('preview');

  return (
    <div className="showcase-example">
      <div className="showcase-example__toolbar">
        <Tabs
          items={[
            { value: 'preview', label: 'Preview' },
            { value: 'code', label: 'Code' },
          ]}
          onValueChange={(value) => setView(value as ExampleView)}
          value={view}
        />
      </div>
      {view === 'preview' ? (
        <div className="showcase-example__preview">{render()}</div>
      ) : (
        <pre className="showcase-example__code">
          <code>{code}</code>
        </pre>
      )}
    </div>
  );
}
