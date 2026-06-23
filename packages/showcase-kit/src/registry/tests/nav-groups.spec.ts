import { createElement } from 'react';
import { describe, expect, it } from 'vitest';
import { buildNavGroups } from '../nav-groups.js';
import { entryFromMeta, pathFor, type ShowcaseEntry } from '../showcase-types.js';

type Group = 'Atoms' | 'Molecules' | 'Organisms';

const registry: readonly ShowcaseEntry<Group>[] = [
  entryFromMeta(
    {
      area: 'agents',
      group: 'Molecules',
      kind: 'component',
      slug: 'composer',
      summary: 'Input surface',
      title: 'Composer',
    },
    () => createElement('div'),
  ),
  entryFromMeta(
    {
      group: 'Atoms',
      kind: 'foundation',
      slug: 'colors',
      summary: 'Token color set',
      title: 'Colors',
    },
    () => createElement('div'),
  ),
];

describe('showcase registry helpers', () => {
  it('builds nav groups in caller order and drops empty groups', () => {
    expect(buildNavGroups(registry, ['Atoms', 'Molecules', 'Organisms'])).toEqual([
      { group: 'Atoms', entries: [registry[1]] },
      { group: 'Molecules', entries: [registry[0]] },
    ]);
  });

  it('derives URL paths from showcase kind and slug', () => {
    expect(pathFor(registry[0])).toBe('/agents/components/composer');
    expect(pathFor(registry[1])).toBe('/core/foundations/colors');
  });
});
