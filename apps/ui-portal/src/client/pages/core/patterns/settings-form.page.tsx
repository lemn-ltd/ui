import { ComponentPage } from '@portal/catalog-kit';
import {
  Button,
  Field,
  Input,
  InputSelect,
  PageHeader,
  Sidebar,
  Toggle,
  VersionTag,
} from '@lemn-ltd/ui';
import type { CSSProperties, ReactElement } from 'react';
import { drillNavGroups } from '../../../fixtures';

// A fixed-height bordered frame replicating the screen shell so the settings
// surface reads as a docs preview, not the page's own viewport.
const FRAME: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'auto 1fr',
  height: 600,
  border: '1px solid var(--lemn-color-border)',
  borderRadius: 'var(--lemn-radius-large)',
  overflow: 'hidden',
  background: 'var(--lemn-color-canvas)',
};

const MAIN: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  minWidth: 0,
};

const CONTENT: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--lemn-space-6)',
  flex: 1,
  minHeight: 0,
  overflow: 'auto',
  padding: 'var(--lemn-space-6)',
};

const SECTION: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--lemn-space-4)',
};

const SECTION_TITLE: CSSProperties = {
  margin: 0,
  fontSize: 'var(--lemn-font-size-heading)',
  fontWeight: 600,
};

const TOGGLE_ROW: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 'var(--lemn-space-4)',
  padding: 'var(--lemn-space-3) 0',
  borderTop: '1px solid var(--lemn-color-border)',
};

const TOGGLE_TEXT: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
};

const TOGGLE_LABEL: CSSProperties = {
  fontSize: 'var(--lemn-font-size-body)',
  color: 'var(--lemn-color-text)',
};

const TOGGLE_HINT: CSSProperties = {
  fontSize: 'var(--lemn-font-size-small)',
  color: 'var(--lemn-color-text-muted)',
};

const FOOTER: CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: 'var(--lemn-space-3)',
  paddingTop: 'var(--lemn-space-4)',
  borderTop: '1px solid var(--lemn-color-border)',
};

const VERSION_ROW: CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-start',
  marginTop: 'var(--lemn-space-2)',
};

function SettingsFormPage(): ReactElement {
  return (
    <ComponentPage
      status="stable"
      summary="A settings screen: a drill-in rail beside form sections built from fields, a select, and a toggle, with a sticky Cancel and Save footer."
      title="Settings form"
    >
      <div style={FRAME}>
        <Sidebar
          back="Workspace"
          groups={drillNavGroups}
          hint="Workspace configuration"
          onBack={() => {}}
          title="Settings"
          variant="drill-in"
        />
        <div style={MAIN}>
          <div style={CONTENT}>
            <PageHeader subtitle="Manage how this workspace behaves." title="General" />

            <section style={SECTION}>
              <h2 style={SECTION_TITLE}>Profile</h2>
              <Field hint="Shown to other members." label="Name">
                {(control) => <Input {...control} defaultValue="Northwind" />}
              </Field>
              <Field label="Default sort">
                {(control) => (
                  <InputSelect
                    {...control}
                    defaultValue="newest"
                    options={[
                      { value: 'newest', label: 'Newest first' },
                      { value: 'oldest', label: 'Oldest first' },
                      { value: 'name', label: 'Name ascending' },
                    ]}
                  />
                )}
              </Field>
            </section>

            <section style={SECTION}>
              <h2 style={SECTION_TITLE}>Preferences</h2>
              <div style={TOGGLE_ROW}>
                <span style={TOGGLE_TEXT}>
                  <span style={TOGGLE_LABEL}>Enable notifications</span>
                  <span style={TOGGLE_HINT}>Receive a message when activity occurs.</span>
                </span>
                <Toggle aria-label="Enable notifications" defaultChecked />
              </div>
              <div style={TOGGLE_ROW}>
                <span style={TOGGLE_TEXT}>
                  <span style={TOGGLE_LABEL}>Show archived</span>
                  <span style={TOGGLE_HINT}>Include archived items in the list.</span>
                </span>
                <Toggle aria-label="Show archived" />
              </div>
            </section>

            <div style={FOOTER}>
              <Button variant="secondary">Cancel</Button>
              <Button variant="primary">Save</Button>
            </div>

            <div style={VERSION_ROW}>
              <VersionTag env="local" version="v0.0.0" />
            </div>
          </div>
        </div>
      </div>
    </ComponentPage>
  );
}

export default SettingsFormPage;
