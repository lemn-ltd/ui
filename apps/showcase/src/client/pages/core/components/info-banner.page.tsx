import { ComponentPage, ExampleBlock, PropsTable, VariantsGallery } from '@appranks/showcase-kit';
import { InfoBanner, type InfoBannerDensity, type InfoBannerVariant } from '@appranks/ui';
import type { ReactElement } from 'react';

const VARIANTS: readonly InfoBannerVariant[] = ['info', 'warn', 'danger', 'success'];
const DENSITIES: readonly InfoBannerDensity[] = ['default', 'compact'];

const VARIANT_MESSAGES: Record<InfoBannerVariant, string> = {
  info: 'Sync runs every five minutes; the latest data is already loaded.',
  warn: 'You have used 90% of your quota. Consider upgrading soon.',
  danger: 'The last upload failed. Check the file format and try again.',
  success: 'Your changes are saved and now live for everyone.',
};

function InfoBannerPage(): ReactElement {
  return (
    <ComponentPage
      status="stable"
      summary="An in-content tinted banner with a tone left border. Variant drives the icon and accent through data-variant; this is not the page-level SystemBar."
      title="Info banner"
    >
      <ExampleBlock
        code={`<InfoBanner variant="info">
  Sync runs every five minutes; the latest data is already loaded.
</InfoBanner>`}
        render={() => <InfoBanner variant="info">{VARIANT_MESSAGES.info}</InfoBanner>}
      />

      <VariantsGallery
        columns={1}
        items={VARIANTS.map((variant) => ({
          label: variant,
          render: () => <InfoBanner variant={variant}>{VARIANT_MESSAGES[variant]}</InfoBanner>,
        }))}
      />

      <ExampleBlock
        code={`<InfoBanner density="compact" variant="danger">
  fetch failed: 504 Gateway Timeout
</InfoBanner>`}
        render={() => (
          <InfoBanner density="compact" variant="danger">
            fetch failed: 504 Gateway Timeout
          </InfoBanner>
        )}
      />

      <ExampleBlock
        code={`<div style={{ maxWidth: 260 }}>
  <InfoBanner density="compact" variant="danger">
    fetch failed: upstream provider returned 504 Gateway Timeout after retry budget was exhausted
  </InfoBanner>
</div>`}
        render={() => (
          <div style={{ maxWidth: 260 }}>
            <InfoBanner density="compact" variant="danger">
              fetch failed: upstream provider returned 504 Gateway Timeout after retry budget was
              exhausted
            </InfoBanner>
          </div>
        )}
      />

      <VariantsGallery
        columns={1}
        items={DENSITIES.map((density) => ({
          label: density,
          render: () => (
            <InfoBanner density={density} variant="warn">
              Quota warning
            </InfoBanner>
          ),
        }))}
      />

      <ExampleBlock
        code={`// Rendered as the LAST element of the scrolling content region:
<InfoBanner variant="danger" floating>
  Service unavailable — make sure the service is running and try again.
</InfoBanner>`}
        render={() => (
          <div
            style={{ maxHeight: 220, overflowY: 'auto', display: 'grid', gap: 'var(--space-3)' }}
          >
            {Array.from({ length: 8 }, (_, index) => (
              <p key={index} style={{ color: 'var(--text-muted)', margin: 0 }}>
                Scrolling content row {index + 1} — the floating banner below stays pinned to the
                bottom edge while you scroll.
              </p>
            ))}
            <InfoBanner floating variant="danger">
              Service unavailable — make sure the service is running and try again.
            </InfoBanner>
          </div>
        )}
      />

      <PropsTable
        rows={[
          {
            name: 'variant',
            type: "'info' | 'warn' | 'danger' | 'success'",
            defaultValue: "'info'",
            description: 'Tone treatment; written to data-variant and selects the leading icon.',
          },
          {
            name: 'density',
            type: "'default' | 'compact'",
            defaultValue: "'default'",
            description:
              'Visual density. Use compact for row-level status details and short inline errors.',
          },
          {
            name: 'floating',
            type: 'boolean',
            defaultValue: 'false',
            description:
              'Sticks the banner to the bottom edge of the scrolling content region (render it as the last content element). Announces via role status/alert.',
          },
          {
            name: 'children',
            type: 'ReactNode',
            description: 'Banner body content.',
          },
          {
            name: '…rest',
            type: 'HTMLAttributes<HTMLDivElement>',
            description: 'Native div props (className, id, …).',
          },
        ]}
      />
    </ComponentPage>
  );
}

export default InfoBannerPage;
