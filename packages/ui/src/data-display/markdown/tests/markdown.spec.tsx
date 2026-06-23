import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Markdown } from '../markdown.js';

const GFM_CONTENT = [
  '# Release notes',
  '',
  'A paragraph with **bold**, `inline()` and a [link](https://example.com).',
  '',
  '- one',
  '- two',
  '',
  '| Gate | Status |',
  '| ---- | ------ |',
  '| Typecheck | Passed |',
].join('\n');

describe('Markdown', () => {
  afterEach(() => cleanup());

  it('renders GFM structure: heading, list, link, and table', () => {
    render(<Markdown content={GFM_CONTENT} />);
    expect(screen.getByRole('heading', { level: 1, name: 'Release notes' })).toBeDefined();
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(screen.getByRole('link', { name: 'link' }).getAttribute('href')).toBe(
      'https://example.com',
    );
    expect(screen.getByRole('table')).toBeDefined();
    expect(document.querySelector('.ui-markdown__table-wrap')).not.toBeNull();
    expect(screen.getByText('Passed')).toBeDefined();
  });

  it('renders inline code with the inline-code class', () => {
    render(<Markdown content={GFM_CONTENT} />);
    const inline = document.querySelector('.ui-markdown__inline-code');
    expect(inline?.textContent).toBe('inline()');
  });

  it('preserves ordered-list starts for stable marker columns', () => {
    render(<Markdown content={'9. ninth\n10. tenth'} />);

    const orderedList = screen.getByRole('list');
    expect(orderedList.getAttribute('start')).toBe('9');
    expect(orderedList.getAttribute('style')).toContain('--ui-markdown-ordered-start: 8');
    expect(screen.getAllByRole('listitem').map((item) => item.textContent)).toEqual([
      'ninth',
      'tenth',
    ]);
  });

  it('renders a fenced block with language chip, plain code fallback, and copy', () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } });

    render(<Markdown content={'```nosuchlang\nplain code\n```'} />);
    const block = document.querySelector('.ui-syntax-code-block');
    expect(block?.getAttribute('data-language')).toBe('nosuchlang');
    expect(block?.querySelector('.ui-syntax-code-block__language')?.textContent).toBe('nosuchlang');
    expect(block?.querySelector('pre code')?.textContent).toBe('plain code');

    fireEvent.click(screen.getByRole('button', { name: 'Copy code' }));
    expect(writeText).toHaveBeenCalledWith('plain code');
    expect(screen.getByRole('button', { name: 'Copied' })).toBeDefined();

    vi.unstubAllGlobals();
  });

  it('never renders raw HTML from the source', () => {
    render(<Markdown content={'# Safe\n\n<script>alert(1)</script>'} />);
    expect(document.querySelector('script')).toBeNull();
  });

  it('merges a caller className onto the root', () => {
    render(<Markdown className="custom" content="text" />);
    expect(document.querySelector('.ui-markdown.custom')).not.toBeNull();
  });
});
