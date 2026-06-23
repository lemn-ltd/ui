import { Badge, ContentLayout } from '@appranks/ui';
import type { ReactElement, ReactNode } from 'react';

export interface ComponentPageProps {
  readonly title: string;
  readonly summary: string;
  readonly status?: 'stable' | 'beta';
  readonly children: ReactNode;
}

/**
 * Shared chrome for every component and pattern page: a titled header with an
 * optional status badge, then a vertical stack of examples, galleries, and
 * tables. Foundation pages keep their own token-reference layout.
 */
export function ComponentPage({
  title,
  summary,
  status,
  children,
}: ComponentPageProps): ReactElement {
  return (
    <ContentLayout>
      <div className="showcase-page">
        <header className="showcase-page__header">
          <div className="showcase-page__title-row">
            <h1>{title}</h1>
            {status ? (
              <Badge tone={status === 'stable' ? 'success' : 'warn'}>{status}</Badge>
            ) : null}
          </div>
          <p className="showcase-page__summary">{summary}</p>
        </header>
        <div className="showcase-stack">{children}</div>
      </div>
    </ContentLayout>
  );
}
