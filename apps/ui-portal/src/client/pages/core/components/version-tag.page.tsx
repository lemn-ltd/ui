import { ComponentPage, ExampleBlock, PropsTable, VariantsGallery } from '@portal/catalog-kit';
import { VersionTag } from '@lemn-ltd/ui';
import type { ReactElement } from 'react';

function VersionTagPage(): ReactElement {
  return (
    <ComponentPage
      status="stable"
      summary="The build marker for the sidebar footer. It shows a version string with an optional environment badge; collapsed, it reduces to a single status dot."
      title="Version tag"
    >
      <ExampleBlock
        code={`<VersionTag version="v1.4.0" env="local" />`}
        render={() => <VersionTag env="local" version="v1.4.0" />}
      />

      <VariantsGallery
        items={[
          {
            label: 'version only',
            render: () => <VersionTag version="v1.4.0" />,
          },
          {
            label: 'with env',
            render: () => <VersionTag env="staging" version="v1.4.0" />,
          },
          {
            label: 'collapsed',
            render: () => <VersionTag collapsed version="v1.4.0" />,
          },
        ]}
      />

      <PropsTable
        rows={[
          {
            name: 'version',
            type: 'ReactNode',
            description: 'The version string shown as the primary label.',
          },
          {
            name: 'env',
            type: 'ReactNode',
            description:
              'Optional environment label, rendered as a dim badge; hidden when collapsed.',
          },
          {
            name: 'collapsed',
            type: 'boolean',
            defaultValue: 'false',
            description:
              'Rail mode: prepends a status dot and hides the env badge (data-collapsed="true").',
          },
          {
            name: '…rest',
            type: 'HTMLAttributes<HTMLDivElement>',
            description: 'Native div props (className, id, …) spread onto the root element.',
          },
        ]}
      />
    </ComponentPage>
  );
}

export default VersionTagPage;
