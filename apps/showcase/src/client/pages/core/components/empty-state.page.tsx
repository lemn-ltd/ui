import { ComponentPage, ExampleBlock, PropsTable, VariantsGallery } from '@appranks/showcase-kit';
import { Button, Card, EmptyState, type EmptyStateIntent } from '@lemn-ltd/ui';
import type { ReactElement } from 'react';

const INTENTS: readonly EmptyStateIntent[] = ['first-run', 'no-results'];

function EmptyStatePage(): ReactElement {
  return (
    <ComponentPage
      status="stable"
      summary="A chrome-less centered content block. first-run invites a first action; no-results is the shared filtered-empty surface. It fills its container and centers its content; card border/radius/background belong to the container. The action is opt-in."
      title="Empty state"
    >
      <ExampleBlock
        code={`<EmptyState
  intent="first-run"
  title="No items yet"
  description="Create your first item to get started."
  action={<Button variant="primary">New item</Button>}
/>`}
        render={() => (
          <EmptyState
            action={<Button variant="primary">New item</Button>}
            description="Create your first item to get started."
            intent="first-run"
            title="No items yet"
          />
        )}
      />

      <ExampleBlock
        code={`<EmptyState intent="no-results" onClearFilters={clearFilters} />`}
        render={() => <EmptyState intent="no-results" onClearFilters={() => undefined} />}
      />

      <ExampleBlock
        code={`<Card>
  <EmptyState intent="no-results" />
</Card>`}
        render={() => (
          <Card>
            <EmptyState intent="no-results" />
          </Card>
        )}
      />

      <VariantsGallery
        columns={1}
        items={INTENTS.map((intent) => ({
          label: `intent="${intent}"`,
          render: () => <EmptyState intent={intent} />,
        }))}
      />

      <VariantsGallery
        columns={1}
        items={[
          {
            label: 'custom icon + content',
            render: () => (
              <EmptyState
                action={<Button variant="primary">Invite members</Button>}
                description="No one has access to this workspace yet."
                icon="user-check"
                intent="first-run"
                title="No members"
              />
            ),
          },
        ]}
      />

      <PropsTable
        rows={[
          {
            name: 'intent',
            type: "'first-run' | 'no-results'",
            defaultValue: "'first-run'",
            description: 'Selects the default copy/icon and is written to data-intent.',
          },
          {
            name: 'icon',
            type: 'IconName',
            description:
              'Overrides the intent default glyph (plus for first-run, search for no-results).',
          },
          {
            name: 'title',
            type: 'ReactNode',
            description: 'Heading; no-results falls back to "No results".',
          },
          {
            name: 'description',
            type: 'ReactNode',
            description: 'Supporting line; no-results falls back to a search/filters hint.',
          },
          {
            name: 'action',
            type: 'ReactNode',
            description:
              'Opt-in action. Provided (even null) it wins; with neither action nor onClearFilters, no action renders.',
          },
          {
            name: 'onClearFilters',
            type: '() => void',
            description:
              'When set (and no action is given), renders the default Clear filters button wired to it.',
          },
          {
            name: 'className',
            type: 'string',
            description: 'Extra class names appended to the root.',
          },
        ]}
      />
    </ComponentPage>
  );
}

export default EmptyStatePage;
