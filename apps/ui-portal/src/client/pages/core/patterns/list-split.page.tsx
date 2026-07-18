import { ComponentPage } from '@portal/catalog-kit';
import { Avatar, Badge, RelativeTime } from '@lemn-ltd/ui';
import { type CSSProperties, type ReactElement, useState } from 'react';
import { people, relativeNow, relativeSamples } from '../../../fixtures';

const ITEMS = people.slice(0, 8);

const SPLIT: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(220px, 320px) 1fr',
  height: 480,
  border: '1px solid var(--lemn-color-border)',
  borderRadius: 'var(--lemn-radius-large)',
  overflow: 'hidden',
  background: 'var(--lemn-color-surface)',
};

const LIST: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  borderRight: '1px solid var(--lemn-color-border)',
  overflowY: 'auto',
};

function rowStyle(active: boolean): CSSProperties {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--lemn-space-3)',
    width: '100%',
    padding: 'var(--lemn-space-3) var(--lemn-space-4)',
    border: 'none',
    borderLeft: `2px solid ${active ? 'var(--lemn-color-accent)' : 'transparent'}`,
    borderBottom: '1px solid var(--lemn-color-border)',
    background: active ? 'var(--lemn-color-accent-soft)' : 'transparent',
    color: 'var(--lemn-color-text)',
    textAlign: 'left',
    cursor: 'pointer',
  };
}

const ROW_TEXT: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
  minWidth: 0,
};

const ROW_NAME: CSSProperties = {
  fontSize: 'var(--lemn-font-size-body)',
  fontWeight: 500,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
};

const ROW_EMAIL: CSSProperties = {
  fontSize: 'var(--lemn-font-size-small)',
  color: 'var(--lemn-color-text-muted)',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
};

const DETAIL: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--lemn-space-5)',
  padding: 'var(--lemn-space-6)',
  overflowY: 'auto',
};

const DETAIL_HEAD: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--lemn-space-4)',
};

const DETAIL_TITLE: CSSProperties = {
  margin: 0,
  fontSize: 'var(--lemn-font-size-title)',
  fontWeight: 600,
};

const FIELD_LIST: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'max-content 1fr',
  columnGap: 'var(--lemn-space-6)',
  rowGap: 'var(--lemn-space-3)',
  alignItems: 'center',
};

const FIELD_LABEL: CSSProperties = {
  fontSize: 'var(--lemn-font-size-small)',
  color: 'var(--lemn-color-text-muted)',
};

const FIELD_VALUE: CSSProperties = {
  fontSize: 'var(--lemn-font-size-body)',
  color: 'var(--lemn-color-text)',
};

function ListSplitPage(): ReactElement {
  const [selectedId, setSelectedId] = useState(ITEMS[0]?.id ?? '');
  const selected = ITEMS.find((item) => item.id === selectedId) ?? ITEMS[0];
  const lastSeen = relativeSamples[2]?.value ?? relativeSamples[0]?.value ?? '';

  return (
    <ComponentPage
      status="stable"
      summary="A master-detail split: a selectable list on the left whose active row carries an accent left bar and a soft accent fill, and a labeled detail panel on the right that tracks the selection."
      title="List + split"
    >
      <div style={SPLIT}>
        <div style={LIST}>
          {ITEMS.map((item) => {
            const active = item.id === selectedId;
            return (
              <button
                key={item.id}
                onClick={() => setSelectedId(item.id)}
                style={rowStyle(active)}
                type="button"
              >
                <Avatar color={item.avatarColor} size={32}>
                  {item.initials}
                </Avatar>
                <span style={ROW_TEXT}>
                  <span style={ROW_NAME}>{item.name}</span>
                  <span style={ROW_EMAIL}>{item.email}</span>
                </span>
              </button>
            );
          })}
        </div>

        <div style={DETAIL}>
          <div style={DETAIL_HEAD}>
            <Avatar color={selected?.avatarColor} size={32}>
              {selected?.initials}
            </Avatar>
            <h2 style={DETAIL_TITLE}>{selected?.name}</h2>
            <Badge tone="success">Active</Badge>
          </div>

          <div style={FIELD_LIST}>
            <span style={FIELD_LABEL}>Name</span>
            <span style={FIELD_VALUE}>{selected?.name}</span>

            <span style={FIELD_LABEL}>Email</span>
            <span style={FIELD_VALUE}>{selected?.email}</span>

            <span style={FIELD_LABEL}>Status</span>
            <span style={FIELD_VALUE}>
              <Badge tone="success">Active</Badge>
            </span>

            <span style={FIELD_LABEL}>Last seen</span>
            <span style={FIELD_VALUE}>
              <RelativeTime now={relativeNow} value={lastSeen} />
            </span>
          </div>
        </div>
      </div>
    </ComponentPage>
  );
}

export default ListSplitPage;
