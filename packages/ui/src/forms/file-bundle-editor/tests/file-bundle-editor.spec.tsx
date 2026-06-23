import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { FileBundleEditor } from '../file-bundle-editor.js';

const files = [
  { path: 'SKILL.md', encoding: 'text' as const, content: '# Skill', sizeLabel: '7 B' },
  { path: 'references/notes.md', encoding: 'text' as const, content: '# Notes' },
  { path: 'assets/logo.png', encoding: 'base64' as const, content: 'abc123', sizeLabel: '1.2 KB' },
];

describe('FileBundleEditor', () => {
  afterEach(() => cleanup());

  it('emits selected files and folders without reading their content', () => {
    const onUploadFiles = vi.fn();
    const onUploadFolder = vi.fn();
    render(
      <FileBundleEditor
        activePath="SKILL.md"
        aria-label="Bundle editor"
        files={files}
        onActivePathChange={() => {}}
        onRemove={() => {}}
        onTextChange={() => {}}
        onUploadFiles={onUploadFiles}
        onUploadFolder={onUploadFolder}
      />,
    );

    const [fileInput, folderInput] =
      document.querySelectorAll<HTMLInputElement>('input[type="file"]');
    const skillFile = new File(['# Skill'], 'SKILL.md', { type: 'text/markdown' });
    const folderFile = new File(['# Notes'], 'notes.md', { type: 'text/markdown' });

    fireEvent.change(fileInput, { target: { files: [skillFile] } });
    fireEvent.change(folderInput, { target: { files: [folderFile] } });

    expect(onUploadFiles).toHaveBeenCalledWith([skillFile]);
    expect(onUploadFolder).toHaveBeenCalledWith([folderFile]);
  });

  it('shows one active text file and emits edits for that path', () => {
    const onActivePathChange = vi.fn();
    const onTextChange = vi.fn();
    render(
      <FileBundleEditor
        activePath="SKILL.md"
        aria-label="Bundle editor"
        files={files}
        onActivePathChange={onActivePathChange}
        onRemove={() => {}}
        onTextChange={onTextChange}
        onUploadFiles={() => {}}
        onUploadFolder={() => {}}
      />,
    );

    fireEvent.change(screen.getByLabelText('Edit SKILL.md'), {
      target: { value: '# Updated skill' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'references/notes.md' }));

    expect(onTextChange).toHaveBeenCalledWith('SKILL.md', '# Updated skill');
    expect(onActivePathChange).toHaveBeenCalledWith('references/notes.md');
  });

  it('marks binary files read-only and allows removal by path', () => {
    const onRemove = vi.fn();
    render(
      <FileBundleEditor
        activePath="assets/logo.png"
        aria-label="Bundle editor"
        files={files}
        onActivePathChange={() => {}}
        onRemove={onRemove}
        onTextChange={() => {}}
        onUploadFiles={() => {}}
        onUploadFolder={() => {}}
      />,
    );

    expect(screen.getByText('read-only')).not.toBeNull();
    expect(
      screen.getByText('This file is included in the bundle but cannot be edited here.'),
    ).not.toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Remove assets/logo.png' }));
    expect(onRemove).toHaveBeenCalledWith('assets/logo.png');
  });

  it('uses a host-provided text editor when supplied', () => {
    const onTextChange = vi.fn();
    render(
      <FileBundleEditor
        activePath="SKILL.md"
        aria-label="Bundle editor"
        files={files}
        onActivePathChange={() => {}}
        onRemove={() => {}}
        onTextChange={onTextChange}
        onUploadFiles={() => {}}
        onUploadFolder={() => {}}
        renderTextEditor={({ onChange, value }) => (
          <button onClick={() => onChange(`${value}\nextra`)} type="button">
            Custom editor
          </button>
        )}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Custom editor' }));
    expect(onTextChange).toHaveBeenCalledWith('SKILL.md', '# Skill\nextra');
  });
});
