import { ComponentPage } from '@portal/catalog-kit';
import { Button, EmptyState, InfoBanner, Skeleton } from '@lemn-ltd/ui';
import type { CSSProperties, ReactElement, ReactNode } from 'react';

// Three states sit side by side so loading, empty, and error read as one
// comparison rather than three separate examples.
const ROW: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  gap: 'var(--lemn-space-4)',
};

const FRAME: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--lemn-space-3)',
  minHeight: 320,
  padding: 'var(--lemn-space-5)',
  border: '1px solid var(--lemn-color-border)',
  borderRadius: 'var(--lemn-radius-large)',
  background: 'var(--lemn-color-surface)',
};

const FRAME_LABEL: CSSProperties = {
  fontSize: 'var(--lemn-font-size-small)',
  fontWeight: 600,
  color: 'var(--lemn-color-text-muted)',
};

const CENTER: CSSProperties = {
  display: 'flex',
  flex: 1,
  alignItems: 'center',
  justifyContent: 'center',
};

const LOADING_ROWS: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--lemn-space-3)',
};

function Frame({ label, children }: { label: string; children: ReactNode }): ReactElement {
  return (
    <div style={FRAME}>
      <span style={FRAME_LABEL}>{label}</span>
      {children}
    </div>
  );
}

function StatesPage(): ReactElement {
  return (
    <ComponentPage
      status="stable"
      summary="The three states a data surface moves through: loading skeletons, an empty first-run placeholder, and a recoverable error with a retry action."
      title="States"
    >
      <div style={ROW}>
        <Frame label="Loading">
          <div style={LOADING_ROWS}>
            {Array.from({ length: 6 }, (_, index) => (
              <Skeleton key={index} shape="rect" style={{ height: 32 }} />
            ))}
          </div>
        </Frame>

        <Frame label="Empty">
          <div style={CENTER}>
            <EmptyState
              description="Create your first item to get started."
              intent="first-run"
              title="Nothing here yet"
            />
          </div>
        </Frame>

        <Frame label="Error">
          <InfoBanner variant="danger">Something went wrong while loading items.</InfoBanner>
          <div>
            <Button variant="secondary">Retry</Button>
          </div>
        </Frame>
      </div>
    </ComponentPage>
  );
}

export default StatesPage;
