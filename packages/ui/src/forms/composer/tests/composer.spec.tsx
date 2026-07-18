import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Composer } from '../composer.js';

const LABEL = 'Message';

function getTextarea(): HTMLTextAreaElement {
  const el = document.querySelector('.ui-composer__textarea') as HTMLTextAreaElement | null;
  if (!el) throw new Error('textarea not found');
  return el;
}

function getAction(name: 'Send' | 'Stop'): HTMLButtonElement | null {
  return document.querySelector(`button[aria-label="${name}"]`);
}

describe('Composer', () => {
  afterEach(() => cleanup());

  it('uses a generic product-neutral placeholder by default', () => {
    const { rerender } = render(
      <Composer aria-label={LABEL} onChange={() => {}} onSubmit={() => {}} value="" />,
    );
    expect(getTextarea().placeholder).toBe('What would you like to do?');

    rerender(
      <Composer
        aria-label={LABEL}
        onChange={() => {}}
        onSubmit={() => {}}
        placeholder="Custom prompt"
        value=""
      />,
    );
    expect(getTextarea().placeholder).toBe('Custom prompt');
  });

  it('defaults to fill width and supports centered content width', () => {
    const { rerender } = render(
      <Composer aria-label={LABEL} onChange={() => {}} onSubmit={() => {}} value="" />,
    );
    expect(document.querySelector('.ui-composer')?.getAttribute('data-width')).toBe('fill');

    rerender(
      <Composer
        aria-label={LABEL}
        onChange={() => {}}
        onSubmit={() => {}}
        value=""
        width="content"
      />,
    );
    expect(document.querySelector('.ui-composer')?.getAttribute('data-width')).toBe('content');
  });

  it('disables Send when the value is empty or whitespace, enables it otherwise', () => {
    const { rerender } = render(
      <Composer aria-label={LABEL} onChange={() => {}} onSubmit={() => {}} value="   " />,
    );
    expect(getAction('Send')?.disabled).toBe(true);
    expect(document.querySelector('.ui-composer')?.getAttribute('data-can-submit')).toBe('false');

    rerender(<Composer aria-label={LABEL} onChange={() => {}} onSubmit={() => {}} value="hi" />);
    expect(getAction('Send')?.disabled).toBe(false);
    expect(document.querySelector('.ui-composer')?.getAttribute('data-can-submit')).toBe('true');
  });

  it('submits the value on Enter when enabled', () => {
    const onSubmit = vi.fn();
    render(<Composer aria-label={LABEL} onChange={() => {}} onSubmit={onSubmit} value="hello" />);
    fireEvent.keyDown(getTextarea(), { key: 'Enter' });
    expect(onSubmit).toHaveBeenCalledWith('hello');
  });

  it('does not submit on Enter when the value is empty', () => {
    const onSubmit = vi.fn();
    render(<Composer aria-label={LABEL} onChange={() => {}} onSubmit={onSubmit} value="  " />);
    fireEvent.keyDown(getTextarea(), { key: 'Enter' });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('inserts a newline on Shift+Enter instead of submitting', () => {
    const onSubmit = vi.fn();
    render(<Composer aria-label={LABEL} onChange={() => {}} onSubmit={onSubmit} value="hello" />);
    const event = fireEvent.keyDown(getTextarea(), { key: 'Enter', shiftKey: true });
    expect(onSubmit).not.toHaveBeenCalled();
    expect(event).toBe(true); // not prevented — the newline is allowed through
  });

  it('ignores Enter during IME composition', () => {
    const onSubmit = vi.fn();
    render(<Composer aria-label={LABEL} onChange={() => {}} onSubmit={onSubmit} value="hello" />);
    fireEvent.keyDown(getTextarea(), { key: 'Enter', isComposing: true });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('shows Stop while streaming and does not submit on Enter', () => {
    const onSubmit = vi.fn();
    render(
      <Composer
        aria-label={LABEL}
        onChange={() => {}}
        onSubmit={onSubmit}
        status="streaming"
        value="hello"
      />,
    );
    expect(getAction('Stop')).not.toBeNull();
    expect(getAction('Send')).toBeNull();

    fireEvent.keyDown(getTextarea(), { key: 'Enter' });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('keeps the textarea editable while streaming', () => {
    render(
      <Composer
        aria-label={LABEL}
        onChange={() => {}}
        onSubmit={() => {}}
        status="streaming"
        value="hello"
      />,
    );
    expect(getTextarea().disabled).toBe(false);
  });

  it('marks the surface busy while streaming', () => {
    render(
      <Composer
        aria-label={LABEL}
        onChange={() => {}}
        onSubmit={() => {}}
        status="streaming"
        value="hello"
      />,
    );
    expect(document.querySelector('.ui-composer')?.getAttribute('aria-busy')).toBe('true');
  });

  it('forwards test ids to the textarea and action buttons', () => {
    const { rerender } = render(
      <Composer
        aria-label={LABEL}
        data-testid="message-input"
        onChange={() => {}}
        onSubmit={() => {}}
        sendButtonTestId="send-message"
        value="hello"
      />,
    );
    expect(document.querySelector('[data-testid="message-input"]')).toBe(getTextarea());
    expect(document.querySelector('[data-testid="send-message"]')).toBe(getAction('Send'));

    rerender(
      <Composer
        aria-label={LABEL}
        data-testid="message-input"
        onChange={() => {}}
        onStop={() => {}}
        onSubmit={() => {}}
        status="streaming"
        stopButtonTestId="chat-interrupt"
        value="hello"
      />,
    );
    expect(document.querySelector('[data-testid="message-input"]')).toBe(getTextarea());
    expect(document.querySelector('[data-testid="chat-interrupt"]')).toBe(getAction('Stop'));
  });

  it('keeps footer content before the send action so Send can sit in the lower-right corner', () => {
    render(
      <Composer
        aria-label={LABEL}
        footerSlot={<span data-testid="composer-footer">Footer</span>}
        onChange={() => {}}
        onSubmit={() => {}}
        sendButtonTestId="send-message"
        value="hello"
      />,
    );

    const actions = document.querySelector('.ui-composer__actions');
    expect(actions?.lastElementChild).toBe(document.querySelector('[data-testid="send-message"]'));
    expect(actions?.firstElementChild).toBe(document.querySelector('.ui-composer__footer'));
  });

  it('calls onStop when Stop is pressed while streaming', () => {
    const onStop = vi.fn();
    render(
      <Composer
        aria-label={LABEL}
        onChange={() => {}}
        onStop={onStop}
        onSubmit={() => {}}
        status="streaming"
        value="hello"
      />,
    );
    fireEvent.click(getAction('Stop') as HTMLButtonElement);
    expect(onStop).toHaveBeenCalledTimes(1);
  });

  it('disables input and actions when status is disabled', () => {
    const onSubmit = vi.fn();
    render(
      <Composer
        aria-label={LABEL}
        onChange={() => {}}
        onSubmit={onSubmit}
        status="disabled"
        value="hello"
      />,
    );
    expect(getTextarea().disabled).toBe(true);
    expect(getAction('Send')?.disabled).toBe(true);

    fireEvent.keyDown(getTextarea(), { key: 'Enter' });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('starts the message area at a single row and runs auto-grow on mount', () => {
    // happy-dom has no layout engine (scrollHeight is 0), so pixel growth is
    // covered in the Portal visual lane. Here we prove the auto-grow contract:
    // the textarea mounts at rows={1} and the resize pass assigns the inline
    // overflow hook it manages.
    render(
      <Composer
        aria-label={LABEL}
        maxRows={8}
        onChange={() => {}}
        onSubmit={() => {}}
        value={'a\nb\nc\nd'}
      />,
    );
    const textarea = getTextarea();
    expect(textarea.getAttribute('rows')).toBe('1');
    expect(textarea.style.overflowY).toBe('hidden');
  });

  it('caps growth at maxRows, then hands off to internal scroll', () => {
    // Force a measurable content height so the cap branch is exercised even
    // without a real layout engine.
    Object.defineProperty(HTMLTextAreaElement.prototype, 'scrollHeight', {
      configurable: true,
      get: () => 10_000,
    });
    try {
      render(
        <Composer
          aria-label={LABEL}
          maxRows={2}
          onChange={() => {}}
          onSubmit={() => {}}
          value={'a\nb\nc\nd\ne\nf'}
        />,
      );
      expect(getTextarea().style.overflowY).toBe('auto');
    } finally {
      Reflect.deleteProperty(HTMLTextAreaElement.prototype, 'scrollHeight');
    }
  });
});
