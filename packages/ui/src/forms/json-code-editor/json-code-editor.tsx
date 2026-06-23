import { json } from '@codemirror/lang-json';
import { HighlightStyle, syntaxHighlighting, syntaxTree } from '@codemirror/language';
import { type Diagnostic, linter } from '@codemirror/lint';
import { EditorState, type Extension } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { tags } from '@lezer/highlight';
import CodeMirror from '@uiw/react-codemirror';
import { type CSSProperties, type HTMLAttributes, type ReactElement, useMemo } from 'react';
import './json-code-editor.css';

export interface JsonCodeEditorProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'onChange'> {
  readonly value: string;
  readonly onChange: (next: string) => void;
  readonly disabled?: boolean;
  readonly readOnly?: boolean;
  readonly invalid?: boolean;
  readonly minHeight?: number;
  readonly maxHeight?: number;
  readonly placeholder?: string;
}

const DEFAULT_MIN_HEIGHT = 320;

const jsonEditorTheme = EditorView.theme({
  '&': {
    backgroundColor: 'transparent',
    color: 'var(--text)',
    fontFamily: 'var(--font-mono)',
    fontSize: 'var(--font-size-mono)',
  },
  '&.cm-focused': {
    outline: 'none',
  },
  '.cm-scroller': {
    fontFamily: 'var(--font-mono)',
    lineHeight: 'var(--line-height-mono)',
  },
  '.cm-content': {
    padding: 'var(--space-3) 0',
  },
  '.cm-line': {
    padding: '0 var(--space-4)',
  },
  '.cm-gutters': {
    backgroundColor: 'transparent',
    borderRight: '1px solid var(--border)',
    color: 'var(--text-muted)',
  },
  '.cm-lineNumbers .cm-gutterElement': {
    minWidth: '2.75ch',
    paddingLeft: 'var(--space-3)',
    paddingRight: 'var(--space-1)',
  },
  '.cm-foldGutter .cm-gutterElement': {
    minWidth: '1.125rem',
    paddingLeft: '0',
    paddingRight: '0',
    textAlign: 'center',
  },
  '.cm-activeLine': {
    backgroundColor: 'color-mix(in srgb, var(--accent-soft) 52%, transparent)',
  },
  '.cm-activeLineGutter': {
    backgroundColor: 'color-mix(in srgb, var(--accent-soft) 60%, transparent)',
    color: 'var(--text)',
  },
  '.cm-selectionBackground, .cm-content ::selection': {
    backgroundColor: 'color-mix(in srgb, var(--accent) 28%, transparent) !important',
  },
  '.cm-cursor': {
    borderLeftColor: 'var(--accent)',
  },
  '.cm-foldPlaceholder': {
    backgroundColor: 'var(--surface2)',
    border: '1px solid var(--border)',
    color: 'var(--text-muted)',
  },
  '.cm-diagnostic': {
    fontFamily: 'var(--font-sans)',
  },
});

const jsonHighlightStyle = HighlightStyle.define([
  { tag: tags.propertyName, color: 'var(--accent)' },
  { tag: tags.string, color: 'var(--text)' },
  { tag: tags.number, color: 'var(--info)' },
  { tag: tags.bool, color: 'var(--info)' },
  { tag: tags.null, color: 'var(--info)' },
  { tag: tags.punctuation, color: 'var(--text-muted)' },
  { tag: tags.squareBracket, color: 'var(--text-muted)' },
  { tag: tags.brace, color: 'var(--text-muted)' },
]);

const jsonParseLinter = linter((view) => jsonParseDiagnosticsForState(view.state), {
  delay: 300,
});

const jsonCodeEditorExtensions: readonly Extension[] = [
  json(),
  syntaxHighlighting(jsonHighlightStyle),
  jsonParseLinter,
  jsonEditorTheme,
];

/** Code editor for JSON text with line numbers, folding, syntax tones, and parse diagnostics. */
export function JsonCodeEditor({
  className,
  disabled = false,
  invalid = false,
  maxHeight,
  minHeight = DEFAULT_MIN_HEIGHT,
  onChange,
  placeholder,
  readOnly = false,
  style,
  value,
  id,
  'aria-describedby': ariaDescribedBy,
  'aria-invalid': ariaInvalid,
  'aria-label': ariaLabel,
  ...rest
}: JsonCodeEditorProps): ReactElement {
  const rootStyle = {
    ...style,
    '--ui-json-code-editor-min-height': `${minHeight}px`,
    ...(maxHeight === undefined ? {} : { '--ui-json-code-editor-max-height': `${maxHeight}px` }),
  } as CSSProperties;
  const editorAttributes = useMemo(() => {
    const attributes: Record<string, string> = {};
    if (id) attributes.id = id;
    if (ariaDescribedBy) attributes['aria-describedby'] = ariaDescribedBy;
    if (ariaLabel) attributes['aria-label'] = ariaLabel;
    const effectiveInvalid = ariaInvalid ?? (invalid || undefined);
    if (effectiveInvalid !== undefined && effectiveInvalid !== false) {
      attributes['aria-invalid'] = String(effectiveInvalid);
    }
    return attributes;
  }, [ariaDescribedBy, ariaInvalid, ariaLabel, id, invalid]);
  const extensions = useMemo(
    () => [
      ...jsonCodeEditorExtensions,
      ...(Object.keys(editorAttributes).length > 0
        ? [EditorView.contentAttributes.of(editorAttributes)]
        : []),
    ],
    [editorAttributes],
  );

  return (
    <div
      {...rest}
      aria-invalid={invalid || undefined}
      className={['ui-json-code-editor', className].filter(Boolean).join(' ')}
      data-disabled={disabled ? 'true' : undefined}
      data-invalid={invalid ? 'true' : undefined}
      style={rootStyle}
    >
      <CodeMirror
        basicSetup={{
          autocompletion: false,
          bracketMatching: true,
          closeBrackets: true,
          foldGutter: true,
          highlightActiveLine: true,
          highlightActiveLineGutter: true,
          highlightSelectionMatches: true,
          indentOnInput: true,
          lineNumbers: true,
          tabSize: 2,
        }}
        editable={!disabled && !readOnly}
        extensions={extensions}
        height="100%"
        indentWithTab={false}
        maxHeight={maxHeight === undefined ? undefined : `${maxHeight}px`}
        minHeight={`${minHeight}px`}
        onChange={onChange}
        placeholder={placeholder}
        readOnly={readOnly || disabled}
        theme="none"
        value={value}
      />
    </div>
  );
}

export function jsonParseDiagnostics(text: string): readonly Diagnostic[] {
  const state = EditorState.create({ doc: text, extensions: [json()] });
  return jsonParseDiagnosticsForState(state);
}

function jsonParseDiagnosticsForState(state: EditorState): readonly Diagnostic[] {
  const text = state.doc.toString();
  if (!text.trim()) return [];

  try {
    JSON.parse(text);
    return [];
  } catch (error) {
    const syntaxDiagnostics = jsonSyntaxDiagnostics(state, text);
    if (syntaxDiagnostics.length > 0) return syntaxDiagnostics;

    const position = jsonErrorPosition(error, text);
    return [
      {
        from: position,
        message: error instanceof Error ? error.message : 'Invalid JSON',
        source: 'JSON',
        severity: 'error',
        to: diagnosticTo(position, text),
      },
    ];
  }
}

function jsonSyntaxDiagnostics(state: EditorState, text: string): readonly Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  const cursor = syntaxTree(state).cursor();

  do {
    if (!cursor.type.isError) continue;
    const position = normalizeSyntaxErrorPosition(cursor.from, cursor.to, text);
    diagnostics.push({
      from: position,
      message: 'Invalid JSON syntax.',
      source: 'JSON',
      severity: 'error',
      to: diagnosticTo(position, text),
    });
  } while (cursor.next());

  return diagnostics;
}

function jsonErrorPosition(error: unknown, text: string): number {
  if (error instanceof SyntaxError) {
    const match = /position\s+(\d+)/u.exec(error.message);
    if (match?.[1]) {
      return normalizeSyntaxErrorPosition(Number(match[1]), Number(match[1]), text);
    }
  }
  return lastSignificantPositionBefore(text.length, text);
}

function normalizeSyntaxErrorPosition(from: number, to: number, text: string): number {
  const position = clamp(from, 0, text.length);
  if (position < to) return position;
  if (position >= text.length) return lastSignificantPositionBefore(position, text);
  return /[}\],]/u.test(text[position] ?? '')
    ? lastSignificantPositionBefore(position, text)
    : position;
}

function diagnosticTo(position: number, text: string): number {
  return Math.min(position + 1, Math.max(position, text.length));
}

function lastSignificantPositionBefore(position: number, text: string): number {
  let cursor = Math.min(position - 1, text.length - 1);
  while (cursor > 0 && /\s/u.test(text[cursor] ?? '')) cursor -= 1;
  return Math.max(0, cursor);
}

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(Math.max(value, min), max);
}
