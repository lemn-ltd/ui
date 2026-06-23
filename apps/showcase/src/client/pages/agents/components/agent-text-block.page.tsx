import { ComponentPage, ExampleBlock, PropsTable } from '@appranks/showcase-kit';
import {
  AgentMessageBubble,
  type AgentMessageContentPart,
  AgentReasoningBlock,
  AgentTextBlock,
  CodeBlock,
} from '@appranks/ui';
import type { ReactElement } from 'react';

const DONE_REASONING: readonly AgentMessageContentPart[] = [
  {
    id: 'reasoning-1',
    state: 'done',
    text: 'The required context is resolved.',
  },
];

const FINAL_TEXT: readonly AgentMessageContentPart[] = [
  {
    id: 'text-1',
    state: 'done',
    text: [
      'The reusable component should live in `@appranks/ui`.',
      '',
      '- Product apps consume it.',
      '- Showcase owns examples and docs.',
    ].join('\n'),
  },
];

const STREAMING_REASONING: readonly AgentMessageContentPart[] = [
  {
    id: 'reasoning-1',
    state: 'streaming',
    text: 'Validating the response contract before showing the final answer.',
  },
];

const STREAMING_TEXT: readonly AgentMessageContentPart[] = [
  {
    id: 'text-1',
    state: 'streaming',
    text: 'This text is withheld until reasoning is done.',
  },
];

const CONTRACT_PREVIEW = JSON.stringify(
  {
    id: 'message-43',
    role: 'assistant',
    parts: [
      {
        type: 'reasoning',
        id: 'reasoning-1',
        text: 'The required context is resolved.',
        state: 'done',
      },
      {
        type: 'text',
        id: 'text-1',
        text: 'The reusable component should live in @appranks/ui.',
        state: 'done',
      },
    ],
  },
  null,
  2,
);

function AgentTextBlockPage(): ReactElement {
  return (
    <ComponentPage
      status="beta"
      summary="A Markdown answer block for agent text parts that can stay hidden while reasoning streams."
      title="Agent text block"
    >
      <ExampleBlock
        code={`const isReasoningStreaming = reasoning.some(
  (entry) => entry.state === "streaming",
);

<AgentTextBlock entries={textParts} visible={!isReasoningStreaming} />`}
        render={() => (
          <>
            <AgentMessageBubble
              content=""
              copyText={FINAL_TEXT.map((entry) => entry.text).join('\n')}
            >
              <AgentReasoningBlock defaultOpen={false} entries={DONE_REASONING} />
              <AgentTextBlock entries={FINAL_TEXT} />
            </AgentMessageBubble>
            <CodeBlock label="UIMessage preview" value={CONTRACT_PREVIEW} />
          </>
        )}
      />

      <ExampleBlock
        code={`<AgentReasoningBlock entries={reasoning} />
<AgentTextBlock entries={textParts} visible={false} />`}
        render={() => (
          <AgentMessageBubble content="" copyText="">
            <AgentReasoningBlock entries={STREAMING_REASONING} />
            <AgentTextBlock entries={STREAMING_TEXT} visible={false} />
          </AgentMessageBubble>
        )}
      />

      <PropsTable
        rows={[
          {
            name: 'entries',
            type: 'readonly AgentMessageContentPart[]',
            description: 'Text parts normalized from UIMessage.parts.',
          },
          {
            name: 'visible',
            type: 'boolean',
            defaultValue: 'true',
            description:
              'When false, the block renders nothing; conversation surfaces use this while reasoning is streaming.',
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

export default AgentTextBlockPage;
