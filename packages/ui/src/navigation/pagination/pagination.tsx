import type { ReactElement } from 'react';
import { Button, Icon, IconButton, InputSelect } from '../../primitives/index.js';
import './pagination.css';

export type PaginationVariant = 'pages' | 'load-more';

export interface PaginationProps {
  readonly total: number;
  readonly page: number;
  readonly pageSize: number;
  readonly onPageChange: (page: number) => void;
  readonly pageSizeOptions?: readonly number[];
  readonly onPageSizeChange?: (size: number) => void;
  readonly variant?: PaginationVariant;
  readonly onLoadMore?: () => void;
}

function pageList(current: number, totalPages: number): readonly (number | 'ellipsis')[] {
  const anchors = [1, totalPages, current, current - 1, current + 1].filter(
    (page) => page >= 1 && page <= totalPages,
  );
  const unique = [...new Set(anchors)].sort((a, b) => a - b);

  const result: (number | 'ellipsis')[] = [];
  let previous = 0;
  for (const page of unique) {
    if (page - previous > 1) result.push('ellipsis');
    result.push(page);
    previous = page;
  }
  return result;
}

export function Pagination({
  total,
  page,
  pageSize,
  onPageChange,
  pageSizeOptions = [10, 25, 50],
  onPageSizeChange,
  variant = 'pages',
  onLoadMore,
}: PaginationProps): ReactElement {
  if (variant === 'load-more') {
    return (
      <div className="ui-pagination" data-variant="load-more">
        <Button className="ui-pagination__load-more" onClick={onLoadMore} variant="secondary">
          Load more
          <Icon name="chevron-down" size={16} />
        </Button>
      </div>
    );
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <div className="ui-pagination" data-variant="pages">
      <span className="ui-pagination__range">
        {start}–{end} of {total}
      </span>
      <div className="ui-pagination__controls">
        {onPageSizeChange ? (
          <InputSelect
            aria-label="Rows per page"
            className="ui-pagination__page-size"
            onValueChange={(next) => onPageSizeChange(Number(next))}
            options={pageSizeOptions.map((size) => ({
              value: String(size),
              label: `${size} / page`,
            }))}
            value={String(pageSize)}
          />
        ) : null}
        <IconButton
          aria-label="Previous page"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          variant="ghost"
        >
          <Icon name="arrow-left" size={16} />
        </IconButton>
        <div className="ui-pagination__pages">
          {pageList(page, totalPages).map((entry, index) =>
            entry === 'ellipsis' ? (
              <span className="ui-pagination__ellipsis" key={`ellipsis-${index}`}>
                …
              </span>
            ) : (
              <button
                aria-current={entry === page ? 'page' : undefined}
                className="ui-pagination__page"
                data-current={entry === page ? 'true' : 'false'}
                key={entry}
                onClick={() => onPageChange(entry)}
                type="button"
              >
                {entry}
              </button>
            ),
          )}
        </div>
        <IconButton
          aria-label="Next page"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          variant="ghost"
        >
          <Icon name="arrow-right" size={16} />
        </IconButton>
      </div>
    </div>
  );
}
