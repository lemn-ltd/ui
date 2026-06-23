import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { AgentToolCallList } from '../agent-tool-call-list.js';
import type { AgentToolCallPart } from '../tool-call-part.js';

afterEach(cleanup);

const TOOL_CALLS: readonly AgentToolCallPart[] = [
  { id: 't-1', name: 'read_file', status: 'completed', input: { path: 'a.ts' } },
  { id: 't-2', name: 'shell', status: 'running', title: 'Running tests' },
  { id: 't-3', name: 'web_fetch', status: 'error', errorText: '504 timeout' },
];

describe('AgentToolCallList', () => {
  it('renders nothing when there are no tool calls', () => {
    const { container } = render(<AgentToolCallList toolCalls={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('groups the calls under a count header with an attention summary', () => {
    render(<AgentToolCallList toolCalls={TOOL_CALLS} />);

    expect(screen.getByText('3 tool calls')).toBeDefined();
    expect(screen.getByText('· 1 running · 1 error')).toBeDefined();
  });

  it('collapses the whole group from the header', () => {
    render(<AgentToolCallList toolCalls={TOOL_CALLS} />);

    expect(screen.getByText('read_file')).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: /3 tool calls/ }));
    expect(screen.queryByText('read_file')).toBeNull();
  });

  it('opens the running call and the last call by default', () => {
    render(<AgentToolCallList toolCalls={TOOL_CALLS} />);

    // Running (t-2) is open: its title is visible only when expanded via the row,
    // but the row label always shows; the error detail (last, t-3) is open by default.
    expect(screen.getByText('504 timeout')).toBeDefined();
  });

  it('renders execution ladder details when provided', () => {
    render(
      <AgentToolCallList
        toolCalls={[
          {
            id: 't-exec',
            name: 'execute',
            status: 'completed',
            execution: {
              requestedStage: 'workspace',
              minimumStage: 'npm',
              selectedStage: 'npm',
              adapterKind: 'cloudflare-sandbox',
              providerKind: 'cloudflare-sandbox',
              environmentRef: 'sandbox:npm:org:session:default',
              escalated: true,
              policyDecision: 'allowed',
              reason: 'npm is resolved through the Cloudflare Sandbox package execution provider.',
            },
          },
        ]}
      />,
    );

    expect(screen.getByLabelText('Execution stage npm')).toBeDefined();
    expect(screen.getByText('workspace')).toBeDefined();
    expect(screen.getByText('npm')).toBeDefined();
    expect(screen.getAllByText('cloudflare-sandbox')).toHaveLength(2);
    expect(
      screen.getByText(
        'npm is resolved through the Cloudflare Sandbox package execution provider.',
      ),
    ).toBeDefined();
  });
});
