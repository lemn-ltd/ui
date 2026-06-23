import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { FileDropzone } from '../file-dropzone.js';

describe('FileDropzone', () => {
  afterEach(() => cleanup());

  it('renders selected file metadata', () => {
    render(
      <FileDropzone
        aria-label="Upload skills"
        files={[{ id: 'skill', name: 'SKILL.md', sizeLabel: '1 KB', fingerprint: 'sha256:abc' }]}
        onFilesAccepted={() => {}}
      />,
    );
    expect(document.querySelector('.ui-file-dropzone__file-name')?.textContent).toBe('SKILL.md');
    expect(document.querySelector('.ui-file-dropzone__fingerprint')?.textContent).toBe(
      'sha256:abc',
    );
  });

  it('emits files chosen through the input', () => {
    const onFilesAccepted = vi.fn();
    render(<FileDropzone aria-label="Upload skills" onFilesAccepted={onFilesAccepted} />);
    const file = new File(['content'], 'SKILL.md', { type: 'text/markdown' });
    fireEvent.change(requiredElement<HTMLInputElement>('input[type="file"]'), {
      target: { files: [file] },
    });
    expect(onFilesAccepted).toHaveBeenCalledWith([file]);
  });

  it('emits dropped files', () => {
    const onFilesAccepted = vi.fn();
    render(<FileDropzone aria-label="Upload skills" onFilesAccepted={onFilesAccepted} />);
    const file = new File(['content'], 'agent.md', { type: 'text/markdown' });
    fireEvent.drop(requiredElement<HTMLLabelElement>('.ui-file-dropzone__target'), {
      dataTransfer: { files: [file] },
    });
    expect(onFilesAccepted).toHaveBeenCalledWith([file]);
  });

  it('does not emit files while disabled', () => {
    const onFilesAccepted = vi.fn();
    render(<FileDropzone aria-label="Upload skills" disabled onFilesAccepted={onFilesAccepted} />);
    const file = new File(['content'], 'SKILL.md');
    fireEvent.drop(requiredElement<HTMLLabelElement>('.ui-file-dropzone__target'), {
      dataTransfer: { files: [file] },
    });
    expect(onFilesAccepted).not.toHaveBeenCalled();
  });

  it('renders a determinate progress bar while uploading', () => {
    render(
      <FileDropzone
        aria-label="Upload"
        files={[{ id: 'a', name: 'a.png', progress: 60, status: 'uploading' }]}
        onFilesAccepted={() => {}}
      />,
    );
    expect(requiredElement('.ui-file-dropzone__progress').getAttribute('aria-valuenow')).toBe('60');
    expect(requiredElement<HTMLElement>('.ui-file-dropzone__progress-bar').style.width).toBe('60%');
  });

  it('shows the error message and fires onRetry / onRemove', () => {
    const onRetry = vi.fn();
    const onRemove = vi.fn();
    render(
      <FileDropzone
        aria-label="Upload"
        files={[{ errorMessage: 'Too large', id: 'a', name: 'a.png', status: 'error' }]}
        onFilesAccepted={() => {}}
        onRemove={onRemove}
        onRetry={onRetry}
      />,
    );
    expect(requiredElement('.ui-file-dropzone__file-error').textContent).toBe('Too large');
    fireEvent.click(requiredElement<HTMLButtonElement>('[aria-label="Retry a.png"]'));
    expect(onRetry).toHaveBeenCalledWith('a');
    fireEvent.click(requiredElement<HTMLButtonElement>('[aria-label="Remove a.png"]'));
    expect(onRemove).toHaveBeenCalledWith('a');
  });

  it('renders a preview thumbnail when previewUrl is set', () => {
    render(
      <FileDropzone
        aria-label="Upload"
        files={[{ id: 'a', name: 'a.png', previewUrl: 'blob:preview', status: 'done' }]}
        onFilesAccepted={() => {}}
      />,
    );
    expect(requiredElement('.ui-file-dropzone__thumb-img').getAttribute('src')).toBe(
      'blob:preview',
    );
  });
});

function requiredElement<TElement extends Element>(selector: string): TElement {
  const element = document.querySelector<TElement>(selector);
  expect(element).not.toBeNull();
  return element as TElement;
}
