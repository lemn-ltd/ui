import { FoundationPage } from '@appranks/showcase-kit';
import type { ReactElement } from 'react';

const LEVELS = [
  { label: 'elev-1', cssVar: '--elev-1' },
  { label: 'elev-2', cssVar: '--elev-2' },
  { label: 'elev-3', cssVar: '--elev-3' },
];

function ElevationPage(): ReactElement {
  return (
    <FoundationPage
      caption="Elevation leans on shadow in Light and softens toward borders in Dark."
      title="Elevation"
    >
        <div className="showcase-elevation-grid">
          {LEVELS.map((level) => (
            <div
              className="showcase-elevation-card"
              key={level.label}
              style={{ boxShadow: `var(${level.cssVar})` }}
            >
              {level.label}
            </div>
          ))}
        </div>
    </FoundationPage>
  );
}

export default ElevationPage;
