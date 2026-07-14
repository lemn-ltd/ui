/**
 * Typed mirror of the design tokens declared in `foundations/tokens.css`.
 *
 * This module has no runtime side effects — the CSS file owns the cascade.
 * It exists so unit tests and type-safe consumers can read the canonical token
 * names and values without parsing CSS. Color tokens carry both Light and Dark
 * values because they differ per theme; scalar tokens are theme-independent.
 */

export type { ColorTheme } from './foundations/theme.js';

const surfaces = {
  light: {
    bg: '#ffffff',
    surface: '#ffffff',
    surface2: '#f3f5f8',
    border: '#e3e8ef',
    borderStrong: '#cbd3df',
  },
  dark: {
    bg: 'oklch(0.13 0.028 261.692)',
    surface: 'oklch(0.13 0.028 261.692)',
    surface2: '#090e1a',
    border: 'oklch(0.278 0.033 256.848)',
    borderStrong: 'oklch(0.373 0.034 259.733)',
  },
} as const;

const text = {
  light: { text: '#0e141b', textMuted: '#5a6b82', textDim: '#8a98ad' },
  dark: {
    text: 'oklch(0.985 0.002 247.839)',
    textMuted: 'oklch(0.707 0.022 261.325)',
    textDim: 'oklch(0.551 0.027 264.364)',
  },
} as const;

const accents = {
  light: {
    accent: '#0d9488',
    accentForeground: '#ffffff',
    accentStrong: '#0f766e',
    accentSoft: '#e6fbf6',
    accent2: '#7c3aed',
    accent2Soft: '#f1ebfd',
  },
  dark: {
    accent: '#5eead4',
    accentForeground: '#0e141b',
    accentStrong: '#2dd4bf',
    accentSoft: '#0f2a2a',
    accent2: '#a78bfa',
    accent2Soft: '#1f1a33',
  },
} as const;

const status = {
  light: { success: '#16a34a', warn: '#d97706', danger: '#dc2626', info: '#2563eb' },
  dark: { success: '#34d399', warn: '#fbbf24', danger: '#f87171', info: '#60a5fa' },
} as const;

const softStatus = {
  light: {
    successSoft: '#e6f6ec',
    warnSoft: '#fdf2e3',
    dangerSoft: '#fdeaea',
    infoSoft: '#e8f0fd',
  },
  dark: {
    successSoft: '#0e2a1a',
    warnSoft: '#2a2310',
    dangerSoft: '#2a1414',
    infoSoft: '#112038',
  },
} as const;

const chart = {
  light: {
    series1: '#2563eb',
    series2: '#0f766e',
    series3: '#d97706',
    series4: '#7c3aed',
    series5: '#e11d48',
    series6: '#15803d',
    series7: '#0369a1',
    series8: '#a16207',
    grid: '#e3e8ef',
    axis: '#5a6b82',
    cursor: 'rgba(37, 99, 235, 0.08)',
    hover: 'rgba(13, 148, 136, 0.12)',
    selection: 'rgba(37, 99, 235, 0.18)',
    tooltipSurface: '#ffffff',
    tooltipBorder: '#cbd3df',
    positive: '#15803d',
    negative: '#dc2626',
  },
  dark: {
    series1: '#60a5fa',
    series2: '#2dd4bf',
    series3: '#fbbf24',
    series4: '#a78bfa',
    series5: '#fb7185',
    series6: '#4ade80',
    series7: '#38bdf8',
    series8: '#f59e0b',
    grid: 'oklch(0.278 0.033 256.848)',
    axis: 'oklch(0.707 0.022 261.325)',
    cursor: 'rgba(96, 165, 250, 0.12)',
    hover: 'rgba(94, 234, 212, 0.14)',
    selection: 'rgba(96, 165, 250, 0.2)',
    tooltipSurface: '#090e1a',
    tooltipBorder: 'oklch(0.373 0.034 259.733)',
    positive: '#4ade80',
    negative: '#f87171',
  },
} as const;

const interaction = {
  light: { focusRing: 'rgba(13, 148, 136, 0.45)', overlay: 'rgba(14, 20, 27, 0.45)' },
  dark: { focusRing: 'rgba(94, 234, 212, 0.55)', overlay: 'rgba(0, 0, 0, 0.6)' },
} as const;

const decorative = {
  light: { avatarPink: '#db2777' },
  dark: { avatarPink: '#f472b6' },
} as const;

const space = {
  0: '0',
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  8: '32px',
  10: '40px',
  12: '48px',
  16: '64px',
} as const;

const radii = { sm: '6px', md: '10px', lg: '14px', pill: '999px' } as const;

const typography = {
  family: {
    sans: '"Inter", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    mono: '"SFMono-Regular", ui-monospace, Consolas, "Liberation Mono", monospace',
  },
  size: {
    display: '28px',
    title: '20px',
    heading: '16px',
    body: '14px',
    small: '13px',
    caption: '12px',
    mono: '13px',
  },
  /** Unitless ratios, never px. */
  lineHeight: {
    display: 1.29,
    title: 1.4,
    heading: 1.5,
    body: 1.43,
    small: 1.38,
    caption: 1.33,
    mono: 1.54,
  },
  weight: { regular: 400, medium: 500, semibold: 600 },
} as const;

const motion = {
  duration: { instant: '80ms', fast: '160ms', normal: '240ms', slow: '360ms' },
  easing: {
    standard: 'cubic-bezier(0.2, 0, 0, 1)',
    emphasized: 'cubic-bezier(0.05, 0.7, 0.1, 1)',
    linear: 'linear',
  },
} as const;

const elevation = {
  light: {
    0: 'none',
    1: '0 1px 2px rgba(14, 20, 27, 0.06), 0 1px 3px rgba(14, 20, 27, 0.1)',
    2: '0 2px 4px rgba(14, 20, 27, 0.08), 0 4px 12px rgba(14, 20, 27, 0.1)',
    3: '0 12px 32px rgba(14, 20, 27, 0.14)',
  },
  dark: {
    0: 'none',
    1: '0 1px 2px rgba(0, 0, 0, 0.5), 0 1px 3px rgba(0, 0, 0, 0.5)',
    2: '0 2px 4px rgba(0, 0, 0, 0.5), 0 4px 12px rgba(0, 0, 0, 0.5)',
    3: '0 12px 32px rgba(0, 0, 0, 0.5)',
  },
} as const;

const breakpoints = { sm: 640, md: 768, lg: 1024, xl: 1280 } as const;

const contentMax = '1200px' as const;

export const tokens = {
  color: { surfaces, text, accents, status, softStatus, chart, interaction, decorative },
  space,
  radii,
  typography,
  motion,
  elevation,
  breakpoints,
  contentMax,
} as const;

export type Tokens = typeof tokens;
