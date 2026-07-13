import { Children, type ReactElement, type ReactNode } from 'react';
import { ContentLayout, PageSection } from '@appranks/ui';
import {
  ShowcasePreviewCanvas,
  useShowcaseRenderMode,
} from '../preview/render-mode.js';

export interface FoundationPageProps {
  readonly title: string;
  readonly caption: string;
  readonly children: ReactNode;
}

/**
 * Shared foundation-page chrome. In card/playground render modes it exposes
 * the first canonical token group as the live preview, matching ComponentPage.
 */
export function FoundationPage({
  title,
  caption,
  children,
}: FoundationPageProps): ReactElement {
  const mode = useShowcaseRenderMode();

  if (mode !== 'page') {
    return <ShowcasePreviewCanvas>{Children.toArray(children)[0]}</ShowcasePreviewCanvas>;
  }

  return (
    <ContentLayout>
      <PageSection caption={caption} title={title}>
        {children}
      </PageSection>
    </ContentLayout>
  );
}
