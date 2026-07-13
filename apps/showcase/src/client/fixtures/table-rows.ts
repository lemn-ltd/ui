import type { DataTableColumn } from '@lemn-ltd/ui';
import { faker, NOW, resetSeed } from './faker-seed.js';
import { people } from './people.js';

resetSeed();

export type TableRowStatus = 'active' | 'pending' | 'paused' | 'archived';

export interface TableRow {
  readonly id: string;
  readonly name: string;
  readonly status: TableRowStatus;
  readonly ownerId: string;
  readonly ownerName: string;
  readonly updatedAt: string;
  readonly value: number;
}

const ROW_COUNT = 137;

const STATUSES: readonly TableRowStatus[] = ['active', 'pending', 'paused', 'archived'];

const STATUS_LABELS: Record<TableRowStatus, string> = {
  active: 'Active',
  pending: 'Pending',
  paused: 'Paused',
  archived: 'Archived',
};

const DAY_MS = 24 * 60 * 60 * 1000;

export const rows: readonly TableRow[] = Array.from({ length: ROW_COUNT }, (_, index) => {
  const owner = people[index % people.length] as (typeof people)[number];
  const ageDays = faker.number.int({ min: 0, max: 240 });
  return {
    id: `row-${String(index + 1).padStart(3, '0')}`,
    name: `${faker.commerce.productAdjective()} ${faker.commerce.product()} ${index + 1}`,
    status: STATUSES[index % STATUSES.length] as TableRowStatus,
    ownerId: owner.id,
    ownerName: owner.name,
    updatedAt: new Date(NOW.getTime() - ageDays * DAY_MS).toISOString(),
    value: faker.number.int({ min: 0, max: 9999 }),
  };
});

export const columns: readonly DataTableColumn<TableRow>[] = [
  {
    key: 'name',
    header: 'Name',
    sortable: true,
    render: (row) => row.name,
    sortValue: (row) => row.name,
  },
  {
    key: 'status',
    header: 'Status',
    sortable: true,
    render: (row) => STATUS_LABELS[row.status],
    sortValue: (row) => row.status,
  },
  {
    key: 'owner',
    header: 'Owner',
    sortable: true,
    render: (row) => row.ownerName,
    sortValue: (row) => row.ownerName,
  },
  {
    key: 'updated',
    header: 'Updated',
    sortable: true,
    render: (row) => row.updatedAt,
    sortValue: (row) => row.updatedAt,
  },
  {
    key: 'value',
    header: 'Value',
    sortable: true,
    render: (row) => row.value,
    sortValue: (row) => row.value,
  },
  {
    key: 'id',
    header: 'Reference',
    sortable: false,
    render: (row) => row.id,
  },
];

export const rowKey = (row: TableRow): string => row.id;
