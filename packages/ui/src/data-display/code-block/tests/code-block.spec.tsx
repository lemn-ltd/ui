import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CodeBlock, type CodeBlockVariant } from '../code-block.js';

const VARIANTS: CodeBlockVariant[] = ['command', 'token', 'inline'];

describe('CodeBlock', () => {
  beforeEach(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
  });

  afterEach(() => cleanup());

  it('maps every variant to data-variant', () => {
    for (const variant of VARIANTS) {
      const { container, unmount } = render(<CodeBlock value="npm i" variant={variant} />);
      expect(container.querySelector('.ui-code-block')?.getAttribute('data-variant')).toBe(variant);
      unmount();
    }
  });

  it('renders a smaller copy icon for the inline variant', () => {
    const { container: inlineContainer } = render(<CodeBlock value="id-1" variant="inline" />);
    const { container: commandContainer } = render(<CodeBlock value="id-1" variant="command" />);

    expect(inlineContainer.querySelector('.ui-code-block__copy svg')?.getAttribute('width')).toBe(
      '14',
    );
    expect(commandContainer.querySelector('.ui-code-block__copy svg')?.getAttribute('width')).toBe(
      '16',
    );
  });

  it('copies the value and swaps copy -> check then reverts', async () => {
    const { container } = render(<CodeBlock value="npm install" />);
    const row = container.querySelector('.ui-code-block__row') as HTMLElement;
    const button = container.querySelector('.ui-code-block__copy') as HTMLElement;

    expect(row.getAttribute('data-copied')).toBe('false');

    fireEvent.click(button);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('npm install');
    expect(row.getAttribute('data-copied')).toBe('true');

    await waitFor(() => expect(row.getAttribute('data-copied')).toBe('false'), {
      timeout: 2500,
    });
  });
});
