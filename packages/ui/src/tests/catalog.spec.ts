import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { type ComponentGroup, componentCatalog } from '../catalog.js';

const GROUPS: readonly ComponentGroup[] = [
  'Primitives',
  'Forms',
  'Overlays',
  'Navigation',
  'Data display',
  'Feedback',
  'Layout',
  'Agents',
];

// Resolved from the package root (vitest cwd); happy-dom's import.meta.url is not a file: URL.
const COMPONENTS_DOC = resolve(process.cwd(), 'docs/components.md');

describe('component catalog', () => {
  it('has unique slugs', () => {
    const slugs = componentCatalog.map((entry) => entry.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('every entry is well-formed', () => {
    for (const entry of componentCatalog) {
      expect(entry.slug).toMatch(/^[a-z][a-z0-9-]*$/);
      expect(entry.title.trim().length).toBeGreaterThan(0);
      expect(GROUPS).toContain(entry.group);
      expect(['stable', 'beta']).toContain(entry.status);
      expect(entry.intent.trim().length).toBeGreaterThan(0);
    }
  });

  it('the when-to-use guide documents every catalogued component', () => {
    const doc = readFileSync(COMPONENTS_DOC, 'utf8');
    const missing = componentCatalog
      .map((entry) => entry.slug)
      .filter((slug) => !doc.includes(`components/${slug}`));
    expect(
      missing,
      `docs/components.md is missing showcase links for: ${missing.join(', ')}`,
    ).toEqual([]);
  });
});
