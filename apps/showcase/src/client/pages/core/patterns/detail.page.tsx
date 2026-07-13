import { ComponentPage } from '@appranks/showcase-kit';
import { Badge, Button, Card, EntityToolbar, StatsStrip, Tabs } from '@lemn-ltd/ui';
import { type CSSProperties, type ReactElement, useState } from 'react';
import { stats, tabs } from '../../../fixtures';

// A fixed-height bordered frame with an internal scroll region so the entity
// detail surface reads as a docs preview rather than the page viewport.
const FRAME: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  height: 640,
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-lg)',
  overflow: 'hidden',
  background: 'var(--surface)',
};

const SCROLL: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-5)',
  flex: 1,
  minHeight: 0,
  overflow: 'auto',
  padding: 'var(--space-5)',
};

const IDENTITY: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--space-3)',
};

const IDENTITY_TITLE: CSSProperties = {
  fontSize: 'var(--font-size-title)',
  fontWeight: 600,
};

const PANELS: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: 'var(--space-4)',
};

const FIELD_LIST: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'max-content 1fr',
  columnGap: 'var(--space-5)',
  rowGap: 'var(--space-2)',
  alignItems: 'center',
};

const FIELD_LABEL: CSSProperties = {
  fontSize: 'var(--font-size-small)',
  color: 'var(--text-muted)',
};

const FIELD_VALUE: CSSProperties = {
  fontSize: 'var(--font-size-body)',
  color: 'var(--text)',
};

const PLACEHOLDER: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: 160,
  border: '1px dashed var(--border-strong)',
  borderRadius: 'var(--radius-md)',
  color: 'var(--text-muted)',
  fontSize: 'var(--font-size-small)',
};

function DetailPage(): ReactElement {
  const [tab, setTab] = useState(tabs[0]?.value ?? 'overview');

  return (
    <ComponentPage
      status="stable"
      summary="An entity detail screen: a toolbar with identity and actions, a stats strip, two summary panels, and a tab strip that swaps the lower content region."
      title="Detail"
    >
      <div style={FRAME}>
        <EntityToolbar
          actions={
            <>
              <Button variant="secondary">Edit</Button>
              <Button variant="primary">Share</Button>
            </>
          }
          identity={
            <span style={IDENTITY}>
              <span style={IDENTITY_TITLE}>Overview</span>
              <Badge tone="success">Active</Badge>
            </span>
          }
        />
        <div style={SCROLL}>
          <StatsStrip stats={stats} />

          <div style={PANELS}>
            <Card title="General">
              <div style={FIELD_LIST}>
                <span style={FIELD_LABEL}>Name</span>
                <span style={FIELD_VALUE}>Northwind workspace</span>

                <span style={FIELD_LABEL}>Status</span>
                <span style={FIELD_VALUE}>
                  <Badge tone="success">Active</Badge>
                </span>

                <span style={FIELD_LABEL}>Visibility</span>
                <span style={FIELD_VALUE}>Team</span>
              </div>
            </Card>

            <Card title="Access">
              <div style={FIELD_LIST}>
                <span style={FIELD_LABEL}>Owner</span>
                <span style={FIELD_VALUE}>Avery Quinn</span>

                <span style={FIELD_LABEL}>Members</span>
                <span style={FIELD_VALUE}>9</span>

                <span style={FIELD_LABEL}>Policy</span>
                <span style={FIELD_VALUE}>Reviewed weekly</span>
              </div>
            </Card>
          </div>

          <Tabs items={tabs} onValueChange={setTab} value={tab} />
          <div style={PLACEHOLDER}>Content for the {tab} tab.</div>
        </div>
      </div>
    </ComponentPage>
  );
}

export default DetailPage;
