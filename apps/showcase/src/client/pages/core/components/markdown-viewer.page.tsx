import { ComponentPage, ExampleBlock, PropsTable } from '@lemn-ltd/showcase-kit';
import { Button, MarkdownViewer } from '@lemn-ltd/ui';
import { type ReactElement, useState } from 'react';

const EVIDENCE = [
  '# Run evidence',
  '',
  'The page behind this window stays **fully interactive** — scroll it, click it,',
  'or open this example with another width. Escape closes the window.',
  '',
  '## Gates',
  '',
  '- Typecheck passed',
  '- Unit tests passed',
  '',
  '```bash',
  'make validate-quick',
  '```',
].join('\n');

function MarkdownViewerPage(): ReactElement {
  const [open, setOpen] = useState(false);
  const [wideOpen, setWideOpen] = useState(false);

  return (
    <ComponentPage
      status="beta"
      summary="A floating non-modal reading window that renders Markdown on the window layer without a scrim: the page behind stays fully interactive. The header carries a built-in find-in-document search (Enter / Shift+Enter cycle through highlighted matches) and an expand-to-full-screen toggle. Escape clears the search first, then closes the window; pointer interaction outside does not. Mobile collapses to a bottom sheet."
      title="Markdown viewer"
    >
      <ExampleBlock
        code={`const [open, setOpen] = useState(false);

<Button variant="secondary" onClick={() => setOpen(true)}>
  Open viewer
</Button>
<MarkdownViewer
  open={open}
  onOpenChange={setOpen}
  title="Run evidence"
  content={markdownSource}
/>`}
        render={() => (
          <>
            <Button onClick={() => setOpen(true)} variant="secondary">
              Open viewer
            </Button>
            <MarkdownViewer
              content={EVIDENCE}
              onOpenChange={setOpen}
              open={open}
              title="Run evidence"
            />
          </>
        )}
      />

      <ExampleBlock
        code={`<MarkdownViewer
  width="lg"
  open={open}
  onOpenChange={setOpen}
  title="Wide viewer"
  content={markdownSource}
/>`}
        render={() => (
          <>
            <Button onClick={() => setWideOpen(true)} variant="secondary">
              Open wide viewer
            </Button>
            <MarkdownViewer
              content={EVIDENCE}
              onOpenChange={setWideOpen}
              open={wideOpen}
              title="Wide viewer"
              width="lg"
            />
          </>
        )}
      />

      <PropsTable
        rows={[
          {
            name: 'title',
            type: 'ReactNode',
            description: 'Heading shown in the window header next to the close button.',
          },
          {
            name: 'content',
            type: 'string',
            description: 'Raw Markdown source rendered by the canonical Markdown component.',
          },
          {
            name: 'open',
            type: 'boolean',
            description: 'Controlled open state.',
          },
          {
            name: 'onOpenChange',
            type: '(open: boolean) => void',
            description: 'Called when the close button or Escape requests a state change.',
          },
          {
            name: 'width',
            type: "'sm' | 'md' | 'lg'",
            description:
              'Window width: sm 380, md 460 (default), lg 600. Mobile collapses to a bottom sheet regardless of width.',
          },
          {
            name: 'className',
            type: 'string',
            description: 'Extra class merged onto the window, for per-surface skinning.',
          },
        ]}
      />
    </ComponentPage>
  );
}

export default MarkdownViewerPage;
