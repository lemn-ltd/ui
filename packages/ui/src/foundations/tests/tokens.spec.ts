import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { brandTokenNames } from '../../tokens.js';

const here = dirname(fileURLToPath(import.meta.url));
const tokensCss = readFileSync(join(here, '..', 'tokens.css'), 'utf8');

describe('semantic brand-token fallback', () => {
  it('declares every token in the public vocabulary', () => {
    for (const tokenName of brandTokenNames) {
      expect(tokensCss, tokenName).toContain(`${tokenName}:`);
    }
  });

  it('reserves every fallback custom property for the LEMN namespace', () => {
    const declarations = [...tokensCss.matchAll(/(--[a-z0-9-]+)\s*:/g)].map(
      ([, name]) => name,
    );
    expect(declarations.length).toBeGreaterThan(0);
    expect(declarations.every((name) => name?.startsWith('--lemn-'))).toBe(true);
  });

  it('is a light-first fallback with no persisted or global theme runtime', () => {
    expect(tokensCss).toMatch(/:root\s*\{[^}]*color-scheme:\s*light/);
    expect(tokensCss).not.toContain('light-dark(');
    expect(tokensCss).not.toContain('data-theme');
    expect(tokensCss).not.toContain('prefers-color-scheme');
  });

  it('keeps typography line heights unitless', () => {
    const declarations =
      tokensCss.match(/--lemn-line-height-[a-z-]+:\s*[^;]+;/g) ?? [];
    expect(declarations.length).toBeGreaterThan(0);
    for (const declaration of declarations) {
      expect(declaration).not.toContain('px');
      expect(declaration).not.toContain('rem');
    }
  });

  it('provides eight provider-neutral chart series', () => {
    for (let index = 1; index <= 8; index += 1) {
      expect(tokensCss).toContain(`--lemn-chart-series-${index}:`);
    }
  });
});
