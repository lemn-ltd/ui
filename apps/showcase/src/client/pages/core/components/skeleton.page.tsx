import { ComponentPage, ExampleBlock, PropsTable, VariantsGallery } from '@appranks/showcase-kit';
import {
  Skeleton,
  SkeletonCard,
  type SkeletonShape,
  SkeletonTableRows,
  SkeletonText,
} from '@appranks/ui';
import type { ReactElement } from 'react';
import { skeletonTableRows, skeletonTextLines } from '../../../fixtures';

const SHAPES: readonly SkeletonShape[] = ['line', 'circle', 'rect'];

const SHAPE_SIZES: Record<SkeletonShape, { width: number; height: number }> = {
  line: { width: 200, height: 12 },
  circle: { width: 40, height: 40 },
  rect: { width: 120, height: 72 },
};

function SkeletonPage(): ReactElement {
  return (
    <ComponentPage
      status="stable"
      summary={`A loading placeholder with a left-to-right shimmer that goes static under reduced motion. The base Skeleton takes a shape; the composed forms cover ${skeletonTextLines} text lines, a card, and ${skeletonTableRows} table rows.`}
      title="Skeleton"
    >
      <ExampleBlock
        code={`<SkeletonText />
<SkeletonCard />
<SkeletonTableRows />`}
        render={() => (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24, width: 320 }}>
            <SkeletonText />
            <SkeletonCard />
            <SkeletonTableRows />
          </div>
        )}
      />

      <VariantsGallery
        items={SHAPES.map((shape) => ({
          label: shape,
          render: () => (
            <Skeleton
              shape={shape}
              style={{ width: SHAPE_SIZES[shape].width, height: SHAPE_SIZES[shape].height }}
            />
          ),
        }))}
      />

      <VariantsGallery
        columns={1}
        items={[
          {
            label: `SkeletonText · ${skeletonTextLines} lines`,
            render: () => (
              <div style={{ width: 320 }}>
                <SkeletonText />
              </div>
            ),
          },
          {
            label: 'SkeletonCard',
            render: () => (
              <div style={{ width: 320 }}>
                <SkeletonCard />
              </div>
            ),
          },
          {
            label: `SkeletonTableRows · ${skeletonTableRows} rows`,
            render: () => (
              <div style={{ width: 320 }}>
                <SkeletonTableRows />
              </div>
            ),
          },
        ]}
      />

      <PropsTable
        rows={[
          {
            name: 'shape',
            type: "'line' | 'circle' | 'rect'",
            defaultValue: "'line'",
            description: 'Base placeholder shape; written to data-shape.',
          },
          {
            name: '…rest',
            type: 'HTMLAttributes<HTMLDivElement>',
            description:
              'Native div props (className, style, …); sizing is normally set with style.',
          },
        ]}
      />

      <PropsTable
        rows={[
          {
            name: 'SkeletonText',
            type: 'HTMLAttributes<HTMLDivElement>',
            description: 'Three text lines of varying width.',
          },
          {
            name: 'SkeletonCard',
            type: 'HTMLAttributes<HTMLDivElement>',
            description: 'A media rect over two text lines.',
          },
          {
            name: 'SkeletonTableRows',
            type: 'HTMLAttributes<HTMLDivElement>',
            description: 'Eight row placeholders matching the table rhythm.',
          },
        ]}
      />
    </ComponentPage>
  );
}

export default SkeletonPage;
