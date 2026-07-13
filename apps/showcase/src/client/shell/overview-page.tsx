import { Card, ContentLayout, Icon, PageSection, SectionGrid } from '@appranks/ui';
import type { ReactElement } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { uiShowcaseAppDescriptor } from '../../app-descriptor';
import {
  navGroups,
  pathFor,
  SHOWCASE_REGISTRY,
} from '../registry/showcase-registry';
import type { UiShowcaseEntry } from '../registry/showcase-types';
import { ComponentPlaygroundDialog } from './component-playground-dialog';
import { LivePreview } from './live-preview';

export function OverviewPage(): ReactElement {
  const sections = navGroups();
  const [searchParams, setSearchParams] = useSearchParams();
  const previewPath = searchParams.get('preview');
  const previewEntry = SHOWCASE_REGISTRY.find((entry) => pathFor(entry) === previewPath);

  const setPreview = (entry: UiShowcaseEntry | undefined): void => {
    const nextParams = new URLSearchParams(searchParams);
    if (entry) nextParams.set('preview', pathFor(entry));
    else nextParams.delete('preview');
    setSearchParams(nextParams, { replace: !entry });
  };

  return (
    <>
      <ContentLayout>
        <PageSection
          caption="Live, product-neutral components — select any preview to interact without leaving the catalog."
          title={uiShowcaseAppDescriptor.displayName}
        >
          {sections.length === 0 ? (
            <p className="showcase-overview-empty">Component pages are being authored.</p>
          ) : (
            sections.map((section) => (
              <PageSection key={section.group} title={section.group}>
                <SectionGrid>
                  {section.entries.map((entry) => (
                    <article className="showcase-overview-card" key={pathFor(entry)}>
                    <Card className="showcase-overview-card__surface" interactive>
                      <div className="showcase-overview-card__preview-frame">
                          <LivePreview entry={entry} />
                        <button
                          aria-haspopup="dialog"
                          aria-label={`Open ${entry.title} interactive playground`}
                          className="showcase-overview-card__preview-trigger"
                          onClick={() => setPreview(entry)}
                          type="button"
                        >
                          <span className="showcase-overview-card__live-label">
                            <span aria-hidden="true" className="showcase-overview-card__live-dot" />
                            Live preview
                          </span>
                        </button>
                      </div>
                      <div className="showcase-overview-card__copy">
                          <h3>
                            <Link to={pathFor(entry)}>{entry.title}</Link>
                          </h3>
                        <p>{entry.summary}</p>
                          <button
                            className="showcase-overview-card__playground-action"
                            onClick={() => setPreview(entry)}
                            type="button"
                          >
                            Interact
                            <Icon name="maximize-2" size={14} />
                          </button>
                      </div>
                    </Card>
                    </article>
                  ))}
                </SectionGrid>
              </PageSection>
            ))
          )}
        </PageSection>
      </ContentLayout>
      <ComponentPlaygroundDialog
        entry={previewEntry}
        onOpenChange={(open) => {
          if (!open) setPreview(undefined);
        }}
      />
    </>
  );
}
