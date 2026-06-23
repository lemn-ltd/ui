import { entryFromMeta } from '@appranks/showcase-kit';
import { componentCatalog } from '@appranks/ui';
import type { ReactElement } from 'react';
import type { ShowcaseGroup, UiShowcaseEntry } from './showcase-types.js';

const CATALOG_BY_SLUG = new Map(componentCatalog.map((entry) => [entry.slug, entry]));

/**
 * Builds a component `ShowcaseEntry` from the `@appranks/ui` catalog — the
 * single source of its nav title, summary, and status — plus the locally
 * imported page. A slug with no catalog entry is a wiring error, surfaced loudly
 * so the registry can never drift from the package's component set.
 */
export function componentEntry(slug: string, page: () => ReactElement): UiShowcaseEntry {
  const meta = CATALOG_BY_SLUG.get(slug);
  if (!meta) {
    throw new Error(`No @appranks/ui catalog entry for component slug "${slug}"`);
  }
  return entryFromMeta<ShowcaseGroup>(
    {
      group: meta.group,
      area: meta.group === 'Agents' ? 'agents' : 'core',
      kind: 'component',
      slug: meta.slug,
      status: meta.status,
      summary: meta.intent,
      title: meta.title,
    },
    page,
  );
}
