import { Badge, TabNavigation } from '@lemn-ltd/ui';
import type { ReactElement } from 'react';
import { CapabilityDocs, CAPABILITY_PREVIEW_STYLE } from './capability-docs.js';

const CODE = `import { TabNavigation } from '@lemn-ltd/ui';

<TabNavigation
  aria-label="Report sections"
  currentHref="#activity"
  items={[
    { href: '#overview', label: 'Overview' },
    { href: '#activity', label: 'Activity', count: 12 },
  ]}
/>`;

function TabNavigationPage(): ReactElement {
  return (
    <CapabilityDocs
      apiRows={[
        { prop: 'items', type: 'readonly TabNavigationItem[]', description: 'Real href, label, count, badge, and disabled state.' },
        { prop: 'currentHref', type: 'string', description: 'Marks the matching link with aria-current=page.' },
        { prop: 'aria-label', type: 'string', description: 'Required accessible nav name.' },
      ]}
      category="Navigation"
      code={CODE}
      componentName="TabNavigation"
      render={() => (
        <div style={CAPABILITY_PREVIEW_STYLE}>
          <TabNavigation
            aria-label="Report sections"
            currentHref="#activity"
            items={[
              { href: '#overview', label: 'Overview' },
              { href: '#activity', label: 'Activity', count: 12 },
              { href: '#alerts', label: 'Alerts', badge: <Badge tone="danger">3 new</Badge> },
              { href: '#settings', label: 'Settings' },
            ]}
          />
        </div>
      )}
      summary="Navigate between real URLs with responsive tab-like links and explicit current-page state."
      title="Tab navigation"
    />
  );
}

export default TabNavigationPage;
