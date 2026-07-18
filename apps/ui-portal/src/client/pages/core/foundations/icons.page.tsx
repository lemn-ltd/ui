import { FoundationPage } from '@portal/catalog-kit';
import { Icon, iconNames } from '@lemn-ltd/ui';
import type { ReactElement } from 'react';

function IconsPage(): ReactElement {
  return (
    <FoundationPage
      caption="The product-neutral base glyph set the package re-exports. Domain icons stay in product apps."
      title="Icons"
    >
        <div className="portal-icon-grid">
          {iconNames.map((name) => (
            <div className="portal-icon-cell" key={name}>
              <Icon name={name} size={20} />
              <span className="portal-icon-label">{name}</span>
            </div>
          ))}
        </div>
    </FoundationPage>
  );
}

export default IconsPage;
