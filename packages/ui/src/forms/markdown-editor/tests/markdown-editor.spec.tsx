import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MarkdownEditor } from '../markdown-editor.js';

describe('MarkdownEditor', () => {
  afterEach(() => cleanup());

  it('edits controlled markdown text', () => {
    const onChange = vi.fn();
    render(<MarkdownEditor aria-label="Skill markdown" onChange={onChange} value="" />);
    fireEvent.change(requiredElement<HTMLTextAreaElement>('textarea'), {
      target: { value: '# Skill' },
    });
    expect(onChange).toHaveBeenCalledWith('# Skill');
  });

  it('toggles to a preview rendered by the canonical Markdown renderer, never raw HTML', () => {
    render(
      <MarkdownEditor
        aria-label="Skill markdown"
        onChange={() => {}}
        value={'# Skill\n\n- Step one\n\n<script>alert(1)</script>'}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Preview Markdown' }));
    const preview = document.querySelector('.ui-markdown-editor__preview');
    expect(preview?.querySelector('.ui-markdown')).not.toBeNull();
    expect(preview?.querySelector('h1')?.textContent).toBe('Skill');
    expect(preview?.querySelector('li')?.textContent).toBe('Step one');
    expect(preview?.querySelector('script')).toBeNull();
    expect(document.querySelector('textarea')).toBeNull();
  });

  it('returns to the textarea from the preview toggle', () => {
    render(<MarkdownEditor aria-label="Skill markdown" onChange={() => {}} value="## Draft" />);
    fireEvent.click(screen.getByRole('button', { name: 'Preview Markdown' }));
    fireEvent.click(screen.getByRole('button', { name: 'Edit Markdown' }));
    expect(document.querySelector('textarea')).not.toBeNull();
    expect(document.querySelector('.ui-markdown-editor__preview')).toBeNull();
  });

  it('uses minRows as the write and preview floor', () => {
    const { container } = render(
      <MarkdownEditor
        aria-label="Skill markdown"
        minRows={14}
        onChange={() => {}}
        value={'# Skill\n\n'.repeat(40)}
      />,
    );
    const root = requiredElement<HTMLElement>('.ui-markdown-editor');

    expect(root.style.getPropertyValue('--ui-markdown-editor-block-size')).toBe('287px');
    expect(container.querySelector('textarea')).not.toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Preview Markdown' }));

    expect(root.style.getPropertyValue('--ui-markdown-editor-block-size')).toBe('287px');
    expect(container.querySelector('.ui-markdown-editor__preview')).not.toBeNull();
  });

  it('shows the empty hint when there is nothing to preview', () => {
    render(<MarkdownEditor aria-label="Skill markdown" onChange={() => {}} value="  " />);
    fireEvent.click(screen.getByRole('button', { name: 'Preview Markdown' }));
    expect(document.querySelector('.ui-markdown-editor__empty')?.textContent).toBe(
      'Nothing to preview.',
    );
  });

  it('disables the mode toggle alongside the editor', () => {
    render(<MarkdownEditor aria-label="Skill markdown" disabled onChange={() => {}} value="" />);
    const toggle = screen.getByRole('button', { name: 'Preview Markdown' }) as HTMLButtonElement;
    expect(toggle.disabled).toBe(true);
  });

  it('honors the controlled mode without flipping internal state', () => {
    const onModeChange = vi.fn();
    render(
      <MarkdownEditor
        aria-label="Skill markdown"
        mode="preview"
        onChange={() => {}}
        onModeChange={onModeChange}
        value="# Pinned"
      />,
    );
    expect(document.querySelector('.ui-markdown-editor__preview h1')?.textContent).toBe('Pinned');
    fireEvent.click(screen.getByRole('button', { name: 'Edit Markdown' }));
    expect(onModeChange).toHaveBeenCalledWith('write');
    expect(document.querySelector('.ui-markdown-editor__preview')).not.toBeNull();
  });
});

function requiredElement<TElement extends Element>(selector: string): TElement {
  const element = document.querySelector<TElement>(selector);
  expect(element).not.toBeNull();
  return element as TElement;
}
