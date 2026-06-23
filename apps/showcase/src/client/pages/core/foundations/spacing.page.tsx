import { ContentLayout, PageSection } from '@appranks/ui';
import type { ReactElement } from 'react';

const STEPS: { step: number; px: number }[] = [
  { step: 0, px: 0 },
  { step: 1, px: 4 },
  { step: 2, px: 8 },
  { step: 3, px: 12 },
  { step: 4, px: 16 },
  { step: 5, px: 20 },
  { step: 6, px: 24 },
  { step: 8, px: 32 },
  { step: 10, px: 40 },
  { step: 12, px: 48 },
  { step: 16, px: 64 },
];

const RADII = [
  { label: 'sm', cssVar: '--radius-sm' },
  { label: 'md', cssVar: '--radius-md' },
  { label: 'lg', cssVar: '--radius-lg' },
  { label: 'pill', cssVar: '--radius-pill' },
];

function SpacingPage(): ReactElement {
  return (
    <ContentLayout>
      <PageSection
        caption="A non-contiguous spacing scale (7, 9, 11, 13–15 are intentionally absent) and four radii."
        title="Spacing & radii"
      >
        <PageSection title="Space">
          {STEPS.map((entry) => (
            <div className="showcase-space-row" key={entry.step}>
              <span className="showcase-space-label">
                space-{entry.step} · {entry.px}px
              </span>
              <span
                className="showcase-space-bar"
                style={{ width: `var(--space-${entry.step})` }}
              />
            </div>
          ))}
        </PageSection>

        <PageSection title="Radii">
          <div className="showcase-radii-grid">
            {RADII.map((radius) => (
              <div className="showcase-radii-cell" key={radius.label}>
                <span
                  className="showcase-radii-chip"
                  style={{ borderRadius: `var(${radius.cssVar})` }}
                />
                <span className="showcase-space-label">{radius.label}</span>
              </div>
            ))}
          </div>
        </PageSection>
      </PageSection>
    </ContentLayout>
  );
}

export default SpacingPage;
