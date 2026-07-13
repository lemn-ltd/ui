import { ComponentPage, ExampleBlock, PropsTable, VariantsGallery } from '@appranks/showcase-kit';
import { Pagination, type PaginationVariant } from '@lemn-ltd/ui';
import { type ReactElement, useState } from 'react';

const TOTAL = 137;
const PAGE_SIZE_OPTIONS = [10, 25, 50] as const;
const VARIANTS: readonly PaginationVariant[] = ['pages', 'load-more'];

function PaginationPage(): ReactElement {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  function changePageSize(size: number): void {
    setPageSize(size);
    setPage(1); // A new page size invalidates the current page index.
  }

  return (
    <ComponentPage
      status="stable"
      summary="Page navigation over a total count. The pages variant shows a range, a page-size select, and numbered pages with ellipses; the load-more variant shows a single button."
      title="Pagination"
    >
      <ExampleBlock
        code={`const [page, setPage] = useState(1);
const [pageSize, setPageSize] = useState(10);

<Pagination
  total={137}
  page={page}
  pageSize={pageSize}
  onPageChange={setPage}
  pageSizeOptions={[10, 25, 50]}
  onPageSizeChange={setPageSize}
/>`}
        render={() => (
          <div style={{ width: '100%' }}>
            <Pagination
              onPageChange={setPage}
              onPageSizeChange={changePageSize}
              page={page}
              pageSize={pageSize}
              pageSizeOptions={PAGE_SIZE_OPTIONS}
              total={TOTAL}
            />
          </div>
        )}
      />

      <VariantsGallery
        columns={1}
        items={VARIANTS.map((variant) => ({
          label: variant,
          render: () => (
            <Pagination
              onLoadMore={() => {}}
              onPageChange={() => {}}
              page={3}
              pageSize={10}
              total={TOTAL}
              variant={variant}
            />
          ),
        }))}
      />

      <PropsTable
        rows={[
          {
            name: 'total',
            type: 'number',
            description: 'Total item count, used to derive the range and page count.',
          },
          {
            name: 'page',
            type: 'number',
            description: 'The active 1-based page (controlled).',
          },
          {
            name: 'pageSize',
            type: 'number',
            description: 'Items per page (controlled).',
          },
          {
            name: 'onPageChange',
            type: '(page: number) => void',
            description: 'Fires with the next page index.',
          },
          {
            name: 'pageSizeOptions',
            type: 'readonly number[]',
            defaultValue: '[10, 25, 50]',
            description: 'Options for the page-size select.',
          },
          {
            name: 'onPageSizeChange',
            type: '(size: number) => void',
            description: 'Fires with the next page size; the select renders only when set.',
          },
          {
            name: 'variant',
            type: "'pages' | 'load-more'",
            defaultValue: "'pages'",
            description: 'Pages shows numbered navigation; load-more shows a single button.',
          },
          {
            name: 'onLoadMore',
            type: '() => void',
            description: 'Fires when the load-more button is pressed.',
          },
        ]}
      />
    </ComponentPage>
  );
}

export default PaginationPage;
