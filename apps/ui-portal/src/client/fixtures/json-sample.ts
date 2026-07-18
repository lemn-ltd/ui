/**
 * Sample object for the JSON viewer: ~4 nesting levels and ~28 keys, fully
 * brand-neutral and deterministic.
 */
export const jsonSample = {
  id: 'item-4821',
  name: 'Sample record',
  active: true,
  tags: ['alpha', 'beta', 'gamma'],
  owner: {
    id: 'person-07',
    name: 'Jordan Lee',
    contact: {
      email: 'jordan.lee@example.com',
      verified: true,
      channels: ['email', 'push'],
    },
  },
  settings: {
    visibility: 'private',
    notifications: {
      enabled: true,
      frequency: 'daily',
      digest: {
        time: '09:00',
        timezone: 'UTC',
        includeSummary: false,
      },
    },
    limits: {
      maxItems: 1000,
      maxSize: 524288,
    },
  },
  metrics: {
    views: 1284,
    edits: 57,
    lastValue: null,
  },
  createdAt: '2026-05-18T08:30:00.000Z',
  updatedAt: '2026-06-01T11:45:00.000Z',
} as const;
