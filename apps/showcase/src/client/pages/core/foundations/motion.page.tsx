import { FoundationPage } from '@lemn-ltd/showcase-kit';
import { PageSection, ProgressBar, Skeleton, Spinner } from '@lemn-ltd/ui';
import type { ReactElement } from 'react';

const DURATIONS = [
  { label: 'instant', value: '80ms' },
  { label: 'fast', value: '160ms' },
  { label: 'normal', value: '240ms' },
  { label: 'slow', value: '360ms' },
];

const EASINGS = [
  { label: 'standard', value: 'cubic-bezier(0.2, 0, 0, 1)' },
  { label: 'emphasized', value: 'cubic-bezier(0.05, 0.7, 0.1, 1)' },
  { label: 'linear', value: 'linear' },
];

function MotionPage(): ReactElement {
  return (
    <FoundationPage
      caption="Four durations and three easings, with loops that go static under prefers-reduced-motion."
      title="Motion"
    >
        <PageSection title="Durations">
          {DURATIONS.map((duration) => (
            <div className="showcase-token-row" key={duration.label}>
              <span className="showcase-token-name">{duration.label}</span>
              <span className="showcase-token-value">{duration.value}</span>
            </div>
          ))}
        </PageSection>

        <PageSection title="Easings">
          {EASINGS.map((easing) => (
            <div className="showcase-token-row" key={easing.label}>
              <span className="showcase-token-name">{easing.label}</span>
              <span className="showcase-token-value">{easing.value}</span>
            </div>
          ))}
        </PageSection>

        <PageSection title="Loops">
          <div className="showcase-motion-loops">
            <Spinner />
            <Skeleton shape="line" />
            <ProgressBar variant="indeterminate" />
          </div>
        </PageSection>
    </FoundationPage>
  );
}

export default MotionPage;
