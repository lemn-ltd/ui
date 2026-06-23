import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MarkdownViewer } from '../markdown-viewer.js';

describe('MarkdownViewer', () => {
  afterEach(() => cleanup());

  it('renders title and markdown content when open', () => {
    render(
      <MarkdownViewer
        content={'# Notes\n\nBody text.'}
        onOpenChange={() => {}}
        open
        title="Run evidence"
      />,
    );
    expect(document.querySelector('.ui-markdown-viewer__title')?.textContent).toBe('Run evidence');
    expect(screen.getByRole('heading', { level: 1, name: 'Notes' })).toBeDefined();
    expect(screen.getByText('Body text.')).toBeDefined();
  });

  it('renders nothing when closed', () => {
    render(
      <MarkdownViewer content="# Notes" onOpenChange={() => {}} open={false} title="Closed" />,
    );
    expect(document.querySelector('.ui-markdown-viewer')).toBeNull();
  });

  it('is non-modal: no scrim element is rendered', () => {
    render(<MarkdownViewer content="# Notes" onOpenChange={() => {}} open title="No scrim" />);
    expect(document.querySelector('.ui-markdown-viewer')).not.toBeNull();
    expect(document.querySelector('[data-radix-dialog-overlay]')).toBeNull();
    expect(document.querySelector('.ui-markdown-viewer__overlay')).toBeNull();
  });

  it('routes the close button through onOpenChange', () => {
    const onOpenChange = vi.fn();
    render(<MarkdownViewer content="# Notes" onOpenChange={onOpenChange} open title="Closable" />);
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('writes the width scale to data-width', () => {
    render(<MarkdownViewer content="text" onOpenChange={() => {}} open title="Wide" width="lg" />);
    expect(document.querySelector('.ui-markdown-viewer')?.getAttribute('data-width')).toBe('lg');
  });

  it('toggles the full-screen state from the header', () => {
    render(<MarkdownViewer content="# Notes" onOpenChange={() => {}} open title="Expandable" />);
    const root = document.querySelector('.ui-markdown-viewer');
    expect(root?.getAttribute('data-expanded')).toBe('false');
    fireEvent.click(screen.getByRole('button', { name: 'Expand to full screen' }));
    expect(root?.getAttribute('data-expanded')).toBe('true');
    fireEvent.click(screen.getByRole('button', { name: 'Restore size' }));
    expect(root?.getAttribute('data-expanded')).toBe('false');
  });

  it('finds matches, shows the counter, and cycles with Enter / Shift+Enter', () => {
    render(
      <MarkdownViewer
        content={'# Notes\n\nThe gate passed and the gate recorded evidence.'}
        onOpenChange={() => {}}
        open
        title="Searchable"
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Search content' }));
    const input = screen.getByLabelText('Search in document');

    fireEvent.change(input, { target: { value: 'gate' } });
    expect(screen.getByText('1/2')).toBeDefined();

    fireEvent.keyDown(input, { key: 'Enter' });
    expect(screen.getByText('2/2')).toBeDefined();

    fireEvent.keyDown(input, { key: 'Enter' });
    expect(screen.getByText('1/2')).toBeDefined();

    fireEvent.keyDown(input, { key: 'Enter', shiftKey: true });
    expect(screen.getByText('2/2')).toBeDefined();
  });

  it('shows 0/0 when the query has no matches', () => {
    render(<MarkdownViewer content="# Notes" onOpenChange={() => {}} open title="Empty search" />);
    fireEvent.click(screen.getByRole('button', { name: 'Search content' }));
    fireEvent.change(screen.getByLabelText('Search in document'), {
      target: { value: 'absent' },
    });
    expect(screen.getByText('0/0')).toBeDefined();
  });

  it('Escape clears the query first, then closes the search bar, never the window', () => {
    const onOpenChange = vi.fn();
    render(
      <MarkdownViewer content="# Notes" onOpenChange={onOpenChange} open title="Escape order" />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Search content' }));
    const input = screen.getByLabelText<HTMLInputElement>('Search in document');
    fireEvent.change(input, { target: { value: 'note' } });

    fireEvent.keyDown(input, { key: 'Escape' });
    expect(input.value).toBe('');

    fireEvent.keyDown(input, { key: 'Escape' });
    expect(screen.queryByLabelText('Search in document')).toBeNull();
    expect(onOpenChange).not.toHaveBeenCalled();
  });
});
