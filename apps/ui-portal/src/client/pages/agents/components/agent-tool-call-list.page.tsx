import { ComponentPage, ExampleBlock, PropsTable } from '@portal/catalog-kit';
import { AgentToolCallList, type AgentToolCallPart, CodeBlock } from '@lemn-ltd/ui';
import type { ReactElement } from 'react';

const TOOL_CALLS: readonly AgentToolCallPart[] = [
  {
    id: 't-1',
    name: 'read_file',
    status: 'completed',
    title: 'Read app.tsx',
    time: { start: 0, end: 420 },
    input: { path: 'apps/app/src/client/app.tsx' },
    output: [{ kind: 'json', value: { ok: true, bytes: 5183 } }],
  },
  {
    id: 't-2',
    name: 'shell',
    status: 'running',
    title: 'Running tests',
    input: { command: 'pnpm test' },
  },
  {
    id: 't-3',
    name: 'web_fetch',
    status: 'error',
    title: 'Fetch external data',
    time: { start: 0, end: 12000 },
    input: { url: 'https://example.com/data' },
    errorText: 'fetch failed: 504 Gateway Timeout',
  },
  {
    id: 't-4',
    name: 'apply_patch',
    status: 'confirming',
    title: 'Edit 2 files',
    input: { files: 2, additions: 47, deletions: 3 },
    rule: 'mutating.fs.write',
  },
  {
    id: 't-5',
    name: 'delete_path',
    status: 'denied',
    title: 'Delete .git',
    input: { path: '/workspace/.git' },
    reason: 'Path outside allowed roots',
    rule: 'deny.fs.delete.protected',
  },
  {
    id: 't-6',
    name: 'search_files',
    status: 'interrupted',
    title: 'Search workspace',
    time: { start: 0, end: 1400 },
    input: { query: 'TODO' },
    reason: 'Cancelled by operator',
  },
  {
    id: 't-7',
    name: 'grep',
    status: 'pending',
    title: 'Queued',
    input: { pattern: 'createSandbox' },
  },
];

const CONTRACT_PREVIEW = JSON.stringify(
  {
    event: 'conversation.part.tool_preview',
    messageId: 'message-42',
    partIndex: 1,
    toolName: 'read_file',
    toolCallId: 't-1',
    preview: {
      status: 'completed',
      title: 'Read app.tsx',
      summary: 'Read 5 KB from app.tsx.',
      metadata: { bytes: 5183 },
      time: { start: 0, end: 420 },
    },
  },
  null,
  2,
);

function AgentToolCallListPage(): ReactElement {
  return (
    <ComponentPage
      status="beta"
      summary="A collapsible group of agent tool calls; each row expands to show its input, output content blocks, and per-status evidence."
      title="Agent tool call list"
    >
      <ExampleBlock
        code={`<AgentToolCallList toolCalls={toolCalls} />`}
        render={() => <AgentToolCallList toolCalls={TOOL_CALLS} />}
      />

      <ExampleBlock
        code={`// The host maps each tool part into a normalized AgentToolCallPart.
// Output is the canonical envelope: content[] of text | json | image blocks.
const block = (item) =>
  item.type === "text" ? { kind: "text", text: item.text }
  : item.type === "image" ? { kind: "image", mimeType: item.mimeType, ref: item.data }
  : { kind: "json", value: item.value };`}
        render={() => <CodeBlock label="conversation.part.tool_preview" value={CONTRACT_PREVIEW} />}
      />

      <PropsTable
        rows={[
          {
            name: 'toolCalls',
            type: 'readonly AgentToolCallPart[]',
            description:
              'Tool calls normalized from UIMessage tool parts or public conversation.part.tool_preview events. Renders nothing when empty.',
          },
          {
            name: 'defaultOpen',
            type: 'boolean',
            defaultValue: 'true',
            description:
              'Group disclosure state. Rows open the running call and the last call by default.',
          },
          {
            name: '...rest',
            type: 'HTMLAttributes<HTMLDivElement>',
            description: 'Native div props forwarded to the group wrapper.',
          },
        ]}
      />
    </ComponentPage>
  );
}

export default AgentToolCallListPage;
