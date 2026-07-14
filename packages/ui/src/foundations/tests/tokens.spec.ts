import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { tokens } from '../../tokens.js';

const here = dirname(fileURLToPath(import.meta.url));
const tokensCss = readFileSync(join(here, '..', 'tokens.css'), 'utf8');

function cssCustomProperty(name: string): string {
  const match = tokensCss.match(new RegExp(`--${name}:\\s*([^;]+);`));
  if (!match?.[1]) throw new Error(`Missing CSS custom property --${name}`);
  return match[1].trim();
}

function lightDarkValues(name: string): readonly [light: string, dark: string] {
  const value = cssCustomProperty(name);
  const prefix = 'light-dark(';
  if (!value.startsWith(prefix) || !value.endsWith(')')) {
    throw new Error(`Expected --${name} to use light-dark()`);
  }

  const body = value.slice(prefix.length, -1);
  let depth = 0;
  for (let index = 0; index < body.length; index += 1) {
    const character = body[index];
    if (character === '(') depth += 1;
    if (character === ')') depth -= 1;
    if (character === ',' && depth === 0) {
      return [body.slice(0, index).trim(), body.slice(index + 1).trim()];
    }
  }

  throw new Error(`Could not split light-dark() values for --${name}`);
}

function cssName(name: string): string {
  return name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

function expectColorGroupToMatchCss(group: {
  readonly light: Readonly<Record<string, string>>;
  readonly dark: Readonly<Record<string, string>>;
}, prefix = '', hyphenateDigits = false): void {
  expect(Object.keys(group.dark)).toEqual(Object.keys(group.light));
  for (const name of Object.keys(group.light)) {
    const normalizedName = hyphenateDigits
      ? cssName(name).replace(/([a-z])([0-9])/g, '$1-$2')
      : cssName(name);
    const variableName = `${prefix}${normalizedName}`;
    const [light, dark] = lightDarkValues(variableName);
    expect({ light, dark }, `--${variableName}`).toEqual({
      light: group.light[name],
      dark: group.dark[name],
    });
  }
}

describe('typed token mirror', () => {
  it('exposes line-heights as unitless numeric ratios', () => {
    const lineHeights = Object.values(tokens.typography.lineHeight);
    expect(lineHeights).toEqual([1.29, 1.4, 1.5, 1.43, 1.38, 1.33, 1.54]);
    for (const ratio of lineHeights) {
      expect(typeof ratio).toBe('number');
    }
  });

  it('ships the four soft status tokens in both modes', () => {
    const keys = ['successSoft', 'warnSoft', 'dangerSoft', 'infoSoft'] as const;
    expect(Object.keys(tokens.color.softStatus.light)).toEqual([...keys]);
    expect(Object.keys(tokens.color.softStatus.dark)).toEqual([...keys]);
  });

  it('keeps the emphasized easing distinct from the standard easing', () => {
    expect(tokens.motion.easing.emphasized).toBe('cubic-bezier(0.05, 0.7, 0.1, 1)');
    expect(tokens.motion.easing.emphasized).not.toBe(tokens.motion.easing.standard);
  });

  it('declares a dedicated linear easing for loops', () => {
    expect(tokens.motion.easing.linear).toBe('linear');
  });

  it('carries the breakpoint and content-cap tokens', () => {
    expect(tokens.breakpoints).toEqual({ sm: 640, md: 768, lg: 1024, xl: 1280 });
    expect(tokens.contentMax).toBe('1200px');
  });

  it('uses the non-contiguous spacing scale', () => {
    expect(Object.keys(tokens.space)).toEqual([
      '0',
      '1',
      '2',
      '3',
      '4',
      '5',
      '6',
      '8',
      '10',
      '12',
      '16',
    ]);
  });

  it('stacks two shadows in the elevation-2 token', () => {
    expect(tokens.elevation.light[2]).toBe(
      '0 2px 4px rgba(14, 20, 27, 0.08), 0 4px 12px rgba(14, 20, 27, 0.1)',
    );
  });
});

describe('tokens.css mirror', () => {
  it('exactly matches every theme-dependent color in the typed mirror', () => {
    for (const group of [
      tokens.color.surfaces,
      tokens.color.text,
      tokens.color.accents,
      tokens.color.status,
      tokens.color.softStatus,
      tokens.color.interaction,
      tokens.color.decorative,
    ]) {
      expectColorGroupToMatchCss(group);
    }
    expectColorGroupToMatchCss(tokens.color.chart, 'chart-', true);
  });

  it('never declares a px line-height', () => {
    const lineHeightDeclarations = tokensCss.match(/--line-height-[a-z]+:\s*[^;]+;/g) ?? [];
    expect(lineHeightDeclarations.length).toBeGreaterThan(0);
    for (const declaration of lineHeightDeclarations) {
      expect(declaration).not.toMatch(/px/);
    }
  });

  it('defines the four soft status custom properties', () => {
    for (const token of ['--success-soft', '--warn-soft', '--danger-soft', '--info-soft']) {
      expect(tokensCss).toContain(`${token}:`);
    }
  });

  it('defines the distinct emphasized and linear easings', () => {
    expect(tokensCss).toContain('--easing-emphasized: cubic-bezier(0.05, 0.7, 0.1, 1)');
    expect(tokensCss).toContain('--easing-linear: linear');
  });

  it('uses color-scheme driven tokens so system preference applies only without an explicit theme', () => {
    expect(tokensCss).toContain('light-dark(');
    expect(tokensCss).toMatch(/:root\s*\{[^}]*color-scheme:\s*light dark/);
  });

  it('fixes color-scheme per mode so native controls follow the theme', () => {
    expect(tokensCss).toMatch(/:root\[data-theme="light"\]\s*\{[^}]*color-scheme:\s*light/);
    expect(tokensCss).toMatch(/:root\[data-theme="dark"\]\s*\{[^}]*color-scheme:\s*dark/);
  });
});
