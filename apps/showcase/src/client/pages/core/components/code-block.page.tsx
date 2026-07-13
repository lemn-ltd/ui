import { ComponentPage, ExampleBlock, PropsTable, VariantsGallery } from '@appranks/showcase-kit';
import { CodeBlock, type CodeBlockVariant } from '@lemn-ltd/ui';
import type { ReactElement } from 'react';
import { commandSample, inlineSample, tokenSample } from '../../../fixtures';

const VARIANTS: readonly CodeBlockVariant[] = ['command', 'token', 'inline'];
const SAMPLES: Record<CodeBlockVariant, typeof commandSample> = {
  command: commandSample,
  token: tokenSample,
  inline: inlineSample,
};

function CodeBlockPage(): ReactElement {
  return (
    <ComponentPage
      status="stable"
      summary="A monospace value with a copy control that swaps copy → check while a copy is fresh. The command, token, and inline variants write data-variant; inline drops the chrome for compact rows."
      title="Code block"
    >
      <ExampleBlock
        code={`<CodeBlock
  variant="command"
  label="Install"
  value="npm install --save-dev example-cli"
/>`}
        render={() => (
          <CodeBlock
            label={commandSample.label}
            value={commandSample.value}
            variant={commandSample.variant}
          />
        )}
      />

      <VariantsGallery
        columns={1}
        items={VARIANTS.map((variant) => {
          const sample = SAMPLES[variant];
          return {
            label: variant,
            render: () => <CodeBlock label={sample.label} value={sample.value} variant={variant} />,
          };
        })}
      />

      <VariantsGallery
        columns={1}
        items={[
          {
            label: 'no label',
            render: () => <CodeBlock value={commandSample.value} variant="command" />,
          },
        ]}
      />

      <PropsTable
        rows={[
          {
            name: 'value',
            type: 'string',
            description: 'The monospace text shown and copied to the clipboard.',
          },
          {
            name: 'variant',
            type: "'command' | 'token' | 'inline'",
            defaultValue: "'command'",
            description: 'Visual treatment, written to data-variant.',
          },
          {
            name: 'label',
            type: 'string',
            description: 'Optional caption rendered above the value.',
          },
          {
            name: 'className',
            type: 'string',
            description: 'Extra class names appended to the root.',
          },
        ]}
      />
    </ComponentPage>
  );
}

export default CodeBlockPage;
