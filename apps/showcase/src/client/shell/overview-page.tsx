import { Card, ContentLayout, PageSection, SectionGrid } from '@appranks/ui';
import type { ReactElement } from 'react';
import { Link } from 'react-router-dom';
import { uiShowcaseAppDescriptor } from '../../app-descriptor';
import { navGroups, pathFor } from '../registry/showcase-registry';

export function OverviewPage(): ReactElement {
  const sections = navGroups();

  return (
    <ContentLayout>
      <PageSection
        caption="A product-neutral, token-driven component library — Light default, Dark capable, responsive."
        title={uiShowcaseAppDescriptor.displayName}
      >
        {sections.length === 0 ? (
          <p className="showcase-overview-empty">Component pages are being authored.</p>
        ) : (
          sections.map((section) => (
            <PageSection key={section.group} title={section.group}>
              <SectionGrid>
                {section.entries.map((entry) => (
                  <Link className="showcase-overview-card" key={entry.slug} to={pathFor(entry)}>
                    <Card title={entry.title}>{entry.summary}</Card>
                  </Link>
                ))}
              </SectionGrid>
            </PageSection>
          ))
        )}
      </PageSection>
    </ContentLayout>
  );
}
