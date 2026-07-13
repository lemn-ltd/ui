import { FoundationPage } from '@appranks/showcase-kit';
import { Icon, iconNames } from '@lemn-ltd/ui';
import type { ReactElement } from 'react';

function IconsPage(): ReactElement {
  return (
    <FoundationPage
      caption="The product-neutral base glyph set the package re-exports. Domain icons stay in product apps."
      title="Icons"
    >
        <div className="showcase-icon-grid">
          {iconNames.map((name) => (
            <div className="showcase-icon-cell" key={name}>
              <Icon name={name} size={20} />
              <span className="showcase-icon-label">{name}</span>
            </div>
          ))}
        </div>
    </FoundationPage>
  );
}

export default IconsPage;
