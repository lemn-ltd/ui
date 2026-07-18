import { ComponentPage, ExampleBlock, PropsTable } from '@portal/catalog-kit';
import { Card, ScreenShell } from '@lemn-ltd/ui';
import type { CSSProperties, ReactElement, ReactNode } from 'react';

// ScreenShell fills 100vh, so it renders inside a fixed-height bordered frame
// to read as a preview rather than taking over the page.
function Frame({ children }: { readonly children: ReactNode }): ReactElement {
  const style: CSSProperties = {
    height: 360,
    border: '1px solid var(--lemn-color-border)',
    borderRadius: 'var(--lemn-radius-large)',
    overflow: 'hidden',
  };
  return <div style={style}>{children}</div>;
}

const railStyle: CSSProperties = {
  width: 200,
  height: '100%',
  padding: 'var(--lemn-space-4)',
  background: 'var(--lemn-color-surface)',
  borderRight: '1px solid var(--lemn-color-border)',
  color: 'var(--lemn-color-text-muted)',
};

const barStyle: CSSProperties = {
  padding: 'var(--lemn-space-3) var(--lemn-space-4)',
  borderBottom: '1px solid var(--lemn-color-border)',
  color: 'var(--lemn-color-text-muted)',
};

const contentStyle: CSSProperties = {
  padding: 'var(--lemn-space-4)',
};

function ScreenShellPage(): ReactElement {
  return (
    <ComponentPage
      status="stable"
      summary="The app frame: a fixed sidebar beside a main column that holds an optional top bar over a scrolling content region. It fills the viewport height; only the content region scrolls."
      title="Screen shell"
    >
      <ExampleBlock
        code={`<ScreenShell
  sidebar={<nav>Sidebar</nav>}
  topBar={<header>Top bar</header>}
>
  <main>Scrolling content region</main>
</ScreenShell>`}
        render={() => (
          <Frame>
            <ScreenShell
              sidebar={<div style={railStyle}>Sidebar</div>}
              topBar={<div style={barStyle}>Top bar</div>}
            >
              <div style={contentStyle}>
                <Card title="Content region">
                  The main column holds an optional top bar above this scrolling content area.
                </Card>
              </div>
            </ScreenShell>
          </Frame>
        )}
      />

      <ExampleBlock
        code={`<ScreenShell sidebar={<nav>Sidebar</nav>}>
  <main>Content with no top bar</main>
</ScreenShell>`}
        render={() => (
          <Frame>
            <ScreenShell sidebar={<div style={railStyle}>Sidebar</div>}>
              <div style={contentStyle}>
                <Card title="No top bar">
                  Omit topBar and the main column is just the content region.
                </Card>
              </div>
            </ScreenShell>
          </Frame>
        )}
      />

      <PropsTable
        rows={[
          {
            name: 'sidebar',
            type: 'ReactNode',
            description: 'The fixed-width rail rendered in the first grid column.',
          },
          {
            name: 'children',
            type: 'ReactNode',
            description: 'The scrolling content region of the main column.',
          },
          {
            name: 'topBar',
            type: 'ReactNode',
            description: 'Optional bar pinned above the content region; omitted when not provided.',
          },
        ]}
      />
    </ComponentPage>
  );
}

export default ScreenShellPage;
