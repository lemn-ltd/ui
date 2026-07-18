import { FoundationPage } from '@portal/catalog-kit';
import type { ReactElement } from 'react';

const LEVELS = [
  { label: 'elev-1', cssVar: '--lemn-shadow-raised' },
  { label: 'elev-2', cssVar: '--lemn-shadow-overlay' },
  { label: 'elev-3', cssVar: '--lemn-shadow-modal' },
];

function ElevationPage(): ReactElement {
  return (
    <FoundationPage
      caption="Elevation leans on shadow in Light and softens toward borders in Dark."
      title="Elevation"
    >
        <div className="portal-elevation-grid">
          {LEVELS.map((level) => (
            <div
              className="portal-elevation-card"
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
