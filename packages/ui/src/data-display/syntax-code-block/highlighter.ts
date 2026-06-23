import type { HighlighterCore, LanguageRegistration } from 'shiki/core';
import { createHighlighterCore } from 'shiki/core';
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript';

type LanguageLoader = () => Promise<{ default: LanguageRegistration[] }>;

/** Grammars stay dynamic imports so bundlers code-split them per language. */
const LANGUAGE_LOADERS: Record<string, LanguageLoader> = {
  bash: () => import('@shikijs/langs/bash'),
  css: () => import('@shikijs/langs/css'),
  diff: () => import('@shikijs/langs/diff'),
  dockerfile: () => import('@shikijs/langs/dockerfile'),
  go: () => import('@shikijs/langs/go'),
  graphql: () => import('@shikijs/langs/graphql'),
  html: () => import('@shikijs/langs/html'),
  java: () => import('@shikijs/langs/java'),
  javascript: () => import('@shikijs/langs/javascript'),
  json: () => import('@shikijs/langs/json'),
  jsx: () => import('@shikijs/langs/jsx'),
  markdown: () => import('@shikijs/langs/markdown'),
  python: () => import('@shikijs/langs/python'),
  rust: () => import('@shikijs/langs/rust'),
  sql: () => import('@shikijs/langs/sql'),
  toml: () => import('@shikijs/langs/toml'),
  tsx: () => import('@shikijs/langs/tsx'),
  typescript: () => import('@shikijs/langs/typescript'),
  yaml: () => import('@shikijs/langs/yaml'),
};

const LANGUAGE_ALIASES: Record<string, string> = {
  golang: 'go',
  js: 'javascript',
  md: 'markdown',
  py: 'python',
  rs: 'rust',
  sh: 'bash',
  shell: 'bash',
  ts: 'typescript',
  yml: 'yaml',
  zsh: 'bash',
};

let highlighterPromise: Promise<HighlighterCore> | undefined;
const loadedLanguages = new Map<string, Promise<void>>();

// JS regex engine over Oniguruma — no WASM payload; forgiving skips the rare
// grammar patterns it cannot emulate instead of throwing.
function getHighlighter(): Promise<HighlighterCore> {
  highlighterPromise ??= createHighlighterCore({
    themes: [import('@shikijs/themes/github-light'), import('@shikijs/themes/github-dark')],
    langs: [],
    engine: createJavaScriptRegexEngine({ forgiving: true }),
  });
  return highlighterPromise;
}

/** Resolves a fenced-code language tag to a bundled grammar id, or `null` when unsupported. */
export function resolveLanguage(language: string): string | null {
  const tag = language.toLowerCase();
  const id = LANGUAGE_ALIASES[tag] ?? tag;
  return LANGUAGE_LOADERS[id] ? id : null;
}

type HighlightedCode = ReturnType<HighlighterCore['codeToHast']>;

/**
 * Highlights code into a dual-theme hast tree: github-light colors inline plus
 * `--shiki-dark` variables that the dark mode CSS flips to.
 *
 * @returns The hast tree, or `null` when the language has no bundled grammar
 */
export async function highlightCode(
  code: string,
  language: string,
): Promise<HighlightedCode | null> {
  const lang = resolveLanguage(language);
  if (!lang) return null;

  const highlighter = await getHighlighter();
  let loading = loadedLanguages.get(lang);
  if (!loading) {
    const loader = LANGUAGE_LOADERS[lang] as LanguageLoader;
    loading = highlighter.loadLanguage(loader());
    loadedLanguages.set(lang, loading);
  }
  await loading;

  return highlighter.codeToHast(code, {
    lang,
    themes: { light: 'github-light', dark: 'github-dark' },
    defaultColor: 'light',
  });
}
