import { lazy } from 'react';
import { componentEntry } from '../component-entry.js';
import type { ShowcaseEntry } from '../showcase-types.js';

const FieldPage = lazy(() => import('../../pages/core/components/field.page.js'));
const InlineEditPage = lazy(() => import('../../pages/core/components/inline-edit.page.js'));
const SegmentedControlPage = lazy(
  () => import('../../pages/core/components/segmented-control.page.js'),
);
const ComboboxPage = lazy(() => import('../../pages/core/components/combobox.page.js'));
const AccordionPage = lazy(() => import('../../pages/core/components/accordion.page.js'));
const SelectionListPage = lazy(() => import('../../pages/core/components/selection-list.page.js'));
const ComposerPage = lazy(() => import('../../pages/core/components/composer.page.js'));
const KeyValueEditorPage = lazy(
  () => import('../../pages/core/components/key-value-editor.page.js'),
);
const JsonCodeEditorPage = lazy(
  () => import('../../pages/core/components/json-code-editor.page.js'),
);
const FileDropzonePage = lazy(() => import('../../pages/core/components/file-dropzone.page.js'));
const FileBundleEditorPage = lazy(
  () => import('../../pages/core/components/file-bundle-editor.page.js'),
);
const MarkdownEditorPage = lazy(
  () => import('../../pages/core/components/markdown-editor.page.js'),
);

export const formsEntries: ShowcaseEntry[] = [
  componentEntry('field', () => <FieldPage />),
  componentEntry('inline-edit', () => <InlineEditPage />),
  componentEntry('segmented-control', () => <SegmentedControlPage />),
  componentEntry('combobox', () => <ComboboxPage />),
  componentEntry('accordion', () => <AccordionPage />),
  componentEntry('selection-list', () => <SelectionListPage />),
  componentEntry('composer', () => <ComposerPage />),
  componentEntry('key-value-editor', () => <KeyValueEditorPage />),
  componentEntry('json-code-editor', () => <JsonCodeEditorPage />),
  componentEntry('file-dropzone', () => <FileDropzonePage />),
  componentEntry('file-bundle-editor', () => <FileBundleEditorPage />),
  componentEntry('markdown-editor', () => <MarkdownEditorPage />),
];
