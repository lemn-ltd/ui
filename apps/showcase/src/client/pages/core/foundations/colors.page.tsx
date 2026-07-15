import { FoundationPage } from '@lemn-ltd/showcase-kit';
import { PageSection } from '@lemn-ltd/ui';
import type { ReactElement } from 'react';

interface Swatch {
  readonly label: string;
  readonly cssVar: string;
}

const GROUPS: { title: string; swatches: Swatch[] }[] = [
  {
    title: 'Surfaces & lines',
    swatches: [
      { label: 'bg', cssVar: '--lemn-color-canvas' },
      { label: 'surface', cssVar: '--lemn-color-surface' },
      { label: 'surface2', cssVar: '--lemn-color-surface-muted' },
      { label: 'border', cssVar: '--lemn-color-border' },
      { label: 'borderStrong', cssVar: '--lemn-color-border-strong' },
    ],
  },
  {
    title: 'Text',
    swatches: [
      { label: 'text', cssVar: '--lemn-color-text' },
      { label: 'textMuted', cssVar: '--lemn-color-text-muted' },
      { label: 'textDim', cssVar: '--lemn-color-disabled-text' },
    ],
  },
  {
    title: 'Accents',
    swatches: [
      { label: 'accent', cssVar: '--lemn-color-accent' },
      { label: 'accentStrong', cssVar: '--lemn-color-accent-hover' },
      { label: 'accentSoft', cssVar: '--lemn-color-accent-soft' },
      { label: 'accent2', cssVar: '--lemn-chart-series-2' },
      { label: 'accent2Soft', cssVar: '--lemn-chart-selection' },
    ],
  },
  {
    title: 'Status',
    swatches: [
      { label: 'success', cssVar: '--success' },
      { label: 'warn', cssVar: '--warn' },
      { label: 'danger', cssVar: '--danger' },
      { label: 'info', cssVar: '--info' },
    ],
  },
  {
    title: 'Soft status',
    swatches: [
      { label: 'successSoft', cssVar: '--success-soft' },
      { label: 'warnSoft', cssVar: '--warn-soft' },
      { label: 'dangerSoft', cssVar: '--danger-soft' },
      { label: 'infoSoft', cssVar: '--info-soft' },
    ],
  },
  {
    title: 'Interaction',
    swatches: [
      { label: 'focusRing', cssVar: '--lemn-color-focus' },
      { label: 'overlay', cssVar: '--overlay' },
    ],
  },
];

function ColorsPage(): ReactElement {
  return (
    <FoundationPage
      caption="Every color token resolves per data-theme. Soft status tokens ship in both modes."
      title="Colors"
    >
        {GROUPS.map((group) => (
          <PageSection key={group.title} title={group.title}>
            <div className="showcase-swatch-grid">
              {group.swatches.map((swatch) => (
                <div className="showcase-swatch" key={swatch.cssVar}>
                  <div
                    className="showcase-swatch__chip"
                    style={{ background: `var(${swatch.cssVar})` }}
                  />
                  <div className="showcase-swatch__label">{swatch.label}</div>
                  <div className="showcase-swatch__var">{swatch.cssVar}</div>
                </div>
              ))}
            </div>
          </PageSection>
        ))}
    </FoundationPage>
  );
}

export default ColorsPage;
