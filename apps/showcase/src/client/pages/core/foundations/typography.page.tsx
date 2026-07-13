import { FoundationPage } from '@appranks/showcase-kit';
import { PageSection } from '@lemn-ltd/ui';
import type { CSSProperties, ReactElement } from 'react';

interface Specimen {
  readonly label: string;
  readonly size: number;
  readonly ratio: number;
  readonly style: CSSProperties;
}

const SCALE: Specimen[] = [
  {
    label: 'display',
    size: 28,
    ratio: 1.29,
    style: { fontSize: 'var(--font-size-display)', lineHeight: 'var(--line-height-display)' },
  },
  {
    label: 'title',
    size: 20,
    ratio: 1.4,
    style: { fontSize: 'var(--font-size-title)', lineHeight: 'var(--line-height-title)' },
  },
  {
    label: 'heading',
    size: 16,
    ratio: 1.5,
    style: { fontSize: 'var(--font-size-heading)', lineHeight: 'var(--line-height-heading)' },
  },
  {
    label: 'body',
    size: 14,
    ratio: 1.43,
    style: { fontSize: 'var(--font-size-body)', lineHeight: 'var(--line-height-body)' },
  },
  {
    label: 'small',
    size: 13,
    ratio: 1.38,
    style: { fontSize: 'var(--font-size-small)', lineHeight: 'var(--line-height-small)' },
  },
  {
    label: 'caption',
    size: 12,
    ratio: 1.33,
    style: { fontSize: 'var(--font-size-caption)', lineHeight: 'var(--line-height-caption)' },
  },
];

const WEIGHTS = [
  { label: 'regular', weight: 'var(--font-weight-regular)' },
  { label: 'medium', weight: 'var(--font-weight-medium)' },
  { label: 'semibold', weight: 'var(--font-weight-semibold)' },
];

function TypographyPage(): ReactElement {
  return (
    <FoundationPage
      caption="Sizes pair with unitless line-height ratios; the type families are Inter (sans) and a mono stack."
      title="Typography"
    >
        <PageSection title="Scale">
          {SCALE.map((specimen) => (
            <div className="showcase-type-row" key={specimen.label}>
              <span className="showcase-type-meta">
                {specimen.label} · {specimen.size} / {specimen.ratio}
              </span>
              <span style={specimen.style}>The quick brown fox jumps over the lazy dog</span>
            </div>
          ))}
        </PageSection>

        <PageSection title="Weights">
          {WEIGHTS.map((weight) => (
            <div className="showcase-type-row" key={weight.label}>
              <span className="showcase-type-meta">{weight.label}</span>
              <span style={{ fontSize: 'var(--font-size-heading)', fontWeight: weight.weight }}>
                The quick brown fox
              </span>
            </div>
          ))}
        </PageSection>

        <PageSection title="Mono">
          <div className="showcase-type-row">
            <span className="showcase-type-meta">mono · 13 / 1.54</span>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--font-size-mono)',
                lineHeight: 'var(--line-height-mono)',
              }}
            >
              const tokens = mirror(design);
            </span>
          </div>
        </PageSection>
    </FoundationPage>
  );
}

export default TypographyPage;
