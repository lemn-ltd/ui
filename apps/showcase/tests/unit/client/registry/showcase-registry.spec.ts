import { componentCatalog } from '@lemn-ltd/ui';
import { describe, expect, it } from 'vitest';
import { entriesForModule } from '../../../../src/client/registry/showcase-modules.js';
import {
  pathFor,
  SHOWCASE_REGISTRY,
} from '../../../../src/client/registry/showcase-registry.js';

describe('showcase component registry', () => {
  it('projects every catalog component through its explicit area and family', () => {
    const componentEntries = SHOWCASE_REGISTRY.filter((entry) => entry.kind === 'component');
    expect(componentEntries).toHaveLength(130);

    for (const catalogEntry of componentCatalog) {
      const entry = componentEntries.find((candidate) => candidate.slug === catalogEntry.slug);
      expect(entry, catalogEntry.slug).toMatchObject({
        area: catalogEntry.area,
        group: catalogEntry.group,
      });
      if (entry) {
        expect(pathFor(entry)).toBe(`/${catalogEntry.area}/components/${catalogEntry.slug}`);
      }
    }
  });

  it('keeps Core and Agents component routes in separate module inventories', () => {
    const coreComponents = entriesForModule(SHOWCASE_REGISTRY, 'core').filter(
      (entry) => entry.kind === 'component',
    );
    const agentComponents = entriesForModule(SHOWCASE_REGISTRY, 'agents').filter(
      (entry) => entry.kind === 'component',
    );

    expect(coreComponents).toHaveLength(101);
    expect(agentComponents).toHaveLength(29);
    expect(coreComponents.every((entry) => pathFor(entry).startsWith('/core/components/'))).toBe(
      true,
    );
    expect(
      agentComponents.every((entry) => pathFor(entry).startsWith('/agents/components/')),
    ).toBe(true);
  });
});
