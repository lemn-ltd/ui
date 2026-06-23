import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { AgentToolCallCard } from '../agent-tool-call-card.js';
import type { AgentToolCallPart } from '../tool-call-part.js';

afterEach(cleanup);

function part(overrides: Partial<AgentToolCallPart> = {}): AgentToolCallPart {
  return { id: 't-1', name: 'read_file', status: 'completed', ...overrides };
}

describe('AgentToolCallCard', () => {
  it('collapses the detail by the row, then collapses input by its own toggle', () => {
    render(<AgentToolCallCard toolCall={part({ input: { path: 'a.ts' } })} />);

    expect(screen.queryByText('Input')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /read_file/ }));
    // The Input field shows, but its content stays collapsed until its toggle.
    expect(screen.getByText('Input')).toBeDefined();
    expect(screen.queryByText('"path"')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Input' }));
    expect(screen.getByText('"path"')).toBeDefined();
  });

  it('renders output content blocks once the output field is expanded', () => {
    render(
      <AgentToolCallCard
        defaultOpen
        toolCall={part({
          output: [
            {
              kind: 'text',
              text: 'line one\nline two',
              truncation: { strategy: 'head', maxLines: 200 },
            },
            { kind: 'json', value: { ok: true } },
          ],
        })}
      />,
    );

    expect(screen.getByTitle('Completed')).toBeDefined();
    expect(screen.queryByText('Completed')).toBeNull();
    expect(screen.queryByText(/line one/)).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Output' }));
    expect(screen.getByText(/line one/)).toBeDefined();
    expect(screen.getByText(/Truncated · head · 200 lines/)).toBeDefined();
  });

  it('renders an image output block as an image element', () => {
    render(
      <AgentToolCallCard
        defaultOpen
        toolCall={part({
          name: 'browser_screenshot',
          output: [{ kind: 'image', mimeType: 'image/png', ref: 'data:image/png;base64,AAAA' }],
        })}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Output' }));
    const image = screen.getByRole('img', { name: 'image/png output' }) as HTMLImageElement;
    expect(image.getAttribute('src')).toBe('data:image/png;base64,AAAA');
  });

  it('shows the error banner and the rule/reason fields by status', () => {
    const { rerender } = render(
      <AgentToolCallCard
        defaultOpen
        toolCall={part({ status: 'error', errorText: '504 timeout' })}
      />,
    );
    expect(screen.getByText('504 timeout')).toBeDefined();
    expect(screen.queryByText('Error')).toBeNull();

    rerender(
      <AgentToolCallCard
        defaultOpen
        toolCall={part({ status: 'denied', rule: 'deny.fs.delete', reason: 'protected path' })}
      />,
    );
    expect(screen.getByText('Rule')).toBeDefined();
    expect(screen.getByText('deny.fs.delete')).toBeDefined();
    expect(screen.getByText('Reason')).toBeDefined();
    expect(screen.getByText('protected path')).toBeDefined();
  });

  it('exposes the tool name and status as stable data hooks', () => {
    const { container } = render(<AgentToolCallCard toolCall={part({ status: 'running' })} />);
    const root = container.querySelector('.ui-agent-tool-call-card');

    expect(root?.getAttribute('data-tool-name')).toBe('read_file');
    expect(root?.getAttribute('data-tool-status')).toBe('running');
  });
});
