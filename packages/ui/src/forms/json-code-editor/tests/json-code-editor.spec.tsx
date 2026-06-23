import { cleanup, fireEvent, render } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@uiw/react-codemirror', async () => {
  const React = await import('react');
  return {
    default: ({
      editable,
      onChange,
      placeholder,
      readOnly,
      value,
    }: {
      readonly editable?: boolean;
      readonly onChange?: (value: string) => void;
      readonly placeholder?: ReactNode;
      readonly readOnly?: boolean;
      readonly value?: string;
    }) =>
      React.createElement('textarea', {
        'data-editable': editable ? 'true' : 'false',
        'data-read-only': readOnly ? 'true' : 'false',
        onChange: (event: { target: { value: string } }) => onChange?.(event.target.value),
        placeholder: typeof placeholder === 'string' ? placeholder : undefined,
        value,
      }),
  };
});

import { JsonCodeEditor, jsonParseDiagnostics } from '../json-code-editor.js';

describe('JsonCodeEditor', () => {
  afterEach(() => cleanup());

  it('renders a controlled JSON text editor and emits text changes', () => {
    const onChange = vi.fn();
    render(<JsonCodeEditor onChange={onChange} value='{"ok":true}' />);
    const textarea = document.querySelector('textarea') as HTMLTextAreaElement;

    fireEvent.change(textarea, { target: { value: '{"ok":false}' } });

    expect(textarea.value).toBe('{"ok":true}');
    expect(onChange).toHaveBeenCalledWith('{"ok":false}');
  });

  it('marks disabled and read-only states on the editor surface', () => {
    const { container } = render(<JsonCodeEditor disabled onChange={() => {}} value="{}" />);
    const root = container.querySelector('.ui-json-code-editor');
    const textarea = document.querySelector('textarea');

    expect(root?.getAttribute('data-disabled')).toBe('true');
    expect(textarea?.getAttribute('data-editable')).toBe('false');
    expect(textarea?.getAttribute('data-read-only')).toBe('true');
  });

  it('reflects invalid state for field-level errors', () => {
    const { container } = render(<JsonCodeEditor invalid onChange={() => {}} value="{}" />);

    expect(container.querySelector('.ui-json-code-editor')?.getAttribute('data-invalid')).toBe(
      'true',
    );
  });

  it('reports no parse diagnostics for valid or empty JSON text', () => {
    expect(jsonParseDiagnostics('{"ok": true}')).toEqual([]);
    expect(jsonParseDiagnostics('   ')).toEqual([]);
  });

  it('reports a parse diagnostic for malformed JSON text', () => {
    const [diagnostic] = jsonParseDiagnostics('{"ok": ');

    expect(diagnostic?.severity).toBe('error');
    expect(diagnostic?.message).toContain('JSON');
  });

  it('anchors parse diagnostics to the parser error line instead of the document end', () => {
    const text = '{\n  "ok": true,\n  "missingValue": \n}';
    const [diagnostic] = jsonParseDiagnostics(text);
    const lineNumber = text.slice(0, diagnostic?.from).split('\n').length;

    expect(lineNumber).toBe(3);
  });
});
