import { ComponentPage, ExampleBlock, PropsTable } from '@portal/catalog-kit';
import {
  AgentMessageBubble,
  type AgentMessageContentPart,
  AgentReasoningBlock,
  AgentTextBlock,
  CodeBlock,
} from '@lemn-ltd/ui';
import type { ReactElement } from 'react';

const STREAMING_REASONING: readonly AgentMessageContentPart[] = [
  {
    id: 'reasoning-1',
    state: 'streaming',
    text: [
      'Checking the latest visible user request.',
      '',
      'The response should wait until the reasoning part is done.',
    ].join('\n'),
  },
];

const COMPLETED_REASONING: readonly AgentMessageContentPart[] = [
  {
    id: 'reasoning-1',
    state: 'done',
    text: 'The workspace already exposes shared agent components from `@lemn-ltd/ui`.',
  },
];

const COMPLETED_TEXT: readonly AgentMessageContentPart[] = [
  {
    id: 'text-1',
    state: 'done',
    text: 'The final answer keeps the normal text size and alignment.',
  },
];

const CONTRACT_PREVIEW = JSON.stringify(
  {
    id: 'message-42',
    role: 'assistant',
    parts: [
      {
        type: 'reasoning',
        id: 'reasoning-1',
        text: 'Checking the latest visible user request.',
        state: 'streaming',
      },
      {
        type: 'text',
        id: 'text-1',
        text: 'I will answer after the reasoning part is done.',
        state: 'streaming',
      },
    ],
  },
  null,
  2,
);

function AgentReasoningBlockPage(): ReactElement {
  return (
    <ComponentPage
      status="beta"
      summary="A collapsible Thinking block for streaming and completed agent reasoning parts."
      title="Agent reasoning block"
    >
      <ExampleBlock
        code={`const reasoning = message.parts
  .filter((part) => part.type === "reasoning")
  .map((part) => ({
    id: part.id,
    text: part.text,
    state: part.state,
  }));

<AgentReasoningBlock entries={reasoning} />`}
        render={() => (
          <>
            <AgentMessageBubble
              content=""
              copyText="I will answer after the reasoning part is done."
            >
              <AgentReasoningBlock entries={STREAMING_REASONING} />
            </AgentMessageBubble>
            <CodeBlock label="UIMessage preview" value={CONTRACT_PREVIEW} />
          </>
        )}
      />

      <ExampleBlock
        code={`<AgentReasoningBlock
  defaultOpen={false}
  durationMs={85000}
  entries={[{ id: "reasoning-1", text: "Resolved context.", state: "done" }]}
/>
<AgentTextBlock
  entries={[{ id: "text-1", text: "Final answer.", state: "done" }]}
/>`}
        render={() => (
          <AgentMessageBubble content="" copyText="The answer is ready.">
            <AgentReasoningBlock
              defaultOpen={false}
              durationMs={85_000}
              entries={COMPLETED_REASONING}
            />
            <AgentTextBlock entries={COMPLETED_TEXT} />
          </AgentMessageBubble>
        )}
      />

      <PropsTable
        rows={[
          {
            name: 'entries',
            type: 'readonly AgentMessageContentPart[]',
            description: 'Reasoning parts normalized from UIMessage.parts.',
          },
          {
            name: 'defaultOpen',
            type: 'boolean',
            defaultValue: 'entry.state === "streaming"',
            description:
              'Optional disclosure state. Streaming reasoning opens by default; completed reasoning starts collapsed.',
          },
          {
            name: 'durationMs',
            type: 'number',
            description:
              'Persisted or host-projected reasoning duration in milliseconds. Without it, completed reasoning is labeled Thought instead of fabricating a duration.',
          },
          {
            name: '...rest',
            type: 'HTMLAttributes<HTMLDivElement>',
            description: 'Native div props forwarded to the wrapper.',
          },
        ]}
      />
    </ComponentPage>
  );
}

export default AgentReasoningBlockPage;
