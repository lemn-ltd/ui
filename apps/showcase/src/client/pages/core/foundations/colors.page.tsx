import { FoundationPage } from '@appranks/showcase-kit';
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
      { label: 'bg', cssVar: '--bg' },
      { label: 'surface', cssVar: '--surface' },
      { label: 'surface2', cssVar: '--surface2' },
      { label: 'border', cssVar: '--border' },
      { label: 'borderStrong', cssVar: '--border-strong' },
    ],
  },
  {
    title: 'Text',
    swatches: [
      { label: 'text', cssVar: '--text' },
      { label: 'textMuted', cssVar: '--text-muted' },
      { label: 'textDim', cssVar: '--text-dim' },
    ],
  },
  {
    title: 'Accents',
    swatches: [
      { label: 'accent', cssVar: '--accent' },
      { label: 'accentStrong', cssVar: '--accent-strong' },
      { label: 'accentSoft', cssVar: '--accent-soft' },
      { label: 'accent2', cssVar: '--accent2' },
      { label: 'accent2Soft', cssVar: '--accent2-soft' },
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
      { label: 'focusRing', cssVar: '--focus-ring' },
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
