import { ComponentPage, ExampleBlock, PropsTable } from '@lemn-ltd/showcase-kit';
import { Button, Card, PageSection } from '@lemn-ltd/ui';
import type { ReactElement } from 'react';

function PageSectionPage(): ReactElement {
  return (
    <ComponentPage
      status="stable"
      summary="A titled region of a page. An optional header pairs a title, a caption, and trailing actions above the body; the header collapses entirely when none are set."
      title="Page section"
    >
      <ExampleBlock
        code={`<PageSection
  title="Members"
  caption="People with access to this workspace."
  actions={<Button variant="primary">Invite</Button>}
>
  <Card>Section body content.</Card>
</PageSection>`}
        render={() => (
          <PageSection
            actions={<Button variant="primary">Invite</Button>}
            caption="People with access to this workspace."
            title="Members"
          >
            <Card>Section body content.</Card>
          </PageSection>
        )}
      />

      <ExampleBlock
        code={`<PageSection title="Recent activity">
  <Card>The latest changes across the workspace.</Card>
</PageSection>`}
        render={() => (
          <PageSection title="Recent activity">
            <Card>The latest changes across the workspace.</Card>
          </PageSection>
        )}
      />

      <ExampleBlock
        code={`<PageSection>
  <Card>No header — just a titled-region wrapper around the body.</Card>
</PageSection>`}
        render={() => (
          <PageSection>
            <Card>No header — just a titled-region wrapper around the body.</Card>
          </PageSection>
        )}
      />

      <PropsTable
        rows={[
          {
            name: 'title',
            type: 'ReactNode',
            description: 'Section heading, rendered as an h2 in the header.',
          },
          {
            name: 'caption',
            type: 'ReactNode',
            description: 'Muted supporting text shown under the title.',
          },
          {
            name: 'actions',
            type: 'ReactNode',
            description: 'Trailing controls aligned to the end of the header row.',
          },
          {
            name: 'children',
            type: 'ReactNode',
            description: 'Section body content rendered below the header.',
          },
          {
            name: '…rest',
            type: "Omit<HTMLAttributes<HTMLElement>, 'title'>",
            description: 'Native section props (className, id, …) spread onto the root element.',
          },
        ]}
      />
    </ComponentPage>
  );
}

export default PageSectionPage;
