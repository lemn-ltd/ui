import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SyntaxCodeBlock } from '../syntax-code-block.js';

describe('SyntaxCodeBlock', () => {
  beforeEach(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
  });

  afterEach(() => cleanup());

  it('renders language metadata and plain fallback while highlighting loads', () => {
    const { container } = render(
      <SyntaxCodeBlock language="bash" value={'curl -sS "$API_BASE/v1/sessions"'} wrap />,
    );
    const block = container.querySelector('.ui-syntax-code-block');

    expect(block?.getAttribute('data-language')).toBe('bash');
    expect(block?.getAttribute('data-resolved-language')).toBe('bash');
    expect(block?.getAttribute('data-wrap')).toBe('true');
    expect(container.querySelector('.ui-syntax-code-block__language')?.textContent).toBe('bash');
    expect(container.querySelector('pre code')?.textContent).toBe(
      'curl -sS "$API_BASE/v1/sessions"',
    );
  });

  it('falls back to plain code for unsupported languages', () => {
    const { container } = render(<SyntaxCodeBlock language="nosuchlang" value="plain code" />);
    const block = container.querySelector('.ui-syntax-code-block');

    expect(block?.getAttribute('data-language')).toBe('nosuchlang');
    expect(block?.getAttribute('data-resolved-language')).toBeNull();
    expect(container.querySelector('pre code')?.textContent).toBe('plain code');
  });

  it('copies the value and swaps copy -> check then reverts', async () => {
    render(<SyntaxCodeBlock value="npm install" />);

    fireEvent.click(screen.getByRole('button', { name: 'Copy code' }));

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('npm install');
    expect(screen.getByRole('button', { name: 'Copied' })).toBeDefined();
    expect(document.querySelector('.ui-syntax-code-block')?.getAttribute('data-copied')).toBe(
      'true',
    );

    await waitFor(() => expect(screen.getByRole('button', { name: 'Copy code' })).toBeDefined(), {
      timeout: 2500,
    });
  });
});
