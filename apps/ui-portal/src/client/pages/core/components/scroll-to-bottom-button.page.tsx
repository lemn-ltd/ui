import { ComponentPage, ExampleBlock, PropsTable } from '@portal/catalog-kit';
import { ScrollToBottomButton } from '@lemn-ltd/ui';
import { type ReactElement, useRef } from 'react';

const LINES = Array.from(
  { length: 18 },
  (_, index) => `Event ${String(index + 1).padStart(2, '0')}`,
);

function ScrollToBottomButtonPage(): ReactElement {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <ComponentPage
      status="stable"
      summary="A compact floating chevron action that appears when a scrollport moves away from its newest content and restores the bottom-pinned view."
      title="Scroll to bottom button"
    >
      <ExampleBlock
        code={`const scrollRef = useRef<HTMLDivElement>(null);

<div className="demo-scroll-shell">
  <div ref={scrollRef} className="demo-scrollport">
    {events.map((event) => <p key={event}>{event}</p>)}
  </div>
  <ScrollToBottomButton scrollRef={scrollRef} />
</div>`}
        render={() => (
          <div
            style={{
              position: 'relative',
              width: 'min(520px, 100%)',
              padding: '16px',
              background: 'var(--lemn-color-surface)',
              border: '1px solid var(--lemn-color-border)',
              borderRadius: 'var(--lemn-radius-large)',
            }}
          >
            <div
              ref={scrollRef}
              style={{
                display: 'grid',
                maxHeight: 220,
                gap: 'var(--lemn-space-2)',
                overflowY: 'auto',
                padding: '0 var(--lemn-space-2)',
                scrollbarWidth: 'thin',
              }}
            >
              {LINES.map((line) => (
                <p
                  key={line}
                  style={{
                    margin: 0,
                    padding: 'var(--lemn-space-3)',
                    background: 'var(--lemn-color-surface-muted)',
                    borderRadius: 'var(--lemn-radius-medium)',
                    color: 'var(--lemn-color-text-muted)',
                  }}
                >
                  {line}
                </p>
              ))}
            </div>
            <ScrollToBottomButton
              scrollRef={scrollRef}
              style={{
                position: 'absolute',
                bottom: 24,
                left: '50%',
                transform: 'translateX(-50%)',
              }}
            />
          </div>
        )}
      />

      <PropsTable
        rows={[
          {
            name: 'scrollRef',
            type: 'RefObject<HTMLElement | null>',
            description:
              'Required ref for the scrollable element. The component observes that element for scroll position and content mutations.',
          },
          {
            name: 'aria-label',
            type: 'string',
            defaultValue: "'Scroll to bottom'",
            description: 'Accessible name for the icon-only button.',
          },
          {
            name: '...rest',
            type: 'ButtonHTMLAttributes<HTMLButtonElement>',
            description: 'Native button props forwarded to the button; type defaults to "button".',
          },
        ]}
      />
    </ComponentPage>
  );
}

export default ScrollToBottomButtonPage;
