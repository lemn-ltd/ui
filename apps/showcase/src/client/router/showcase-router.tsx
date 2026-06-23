import { buildShowcaseRouter } from '@appranks/showcase-kit';
import { SHOWCASE_REGISTRY } from '../registry/showcase-registry';
import { NotFoundPage } from '../shell/not-found-page';
import { OverviewPage } from '../shell/overview-page';
import { ShowcaseShell } from '../shell/showcase-shell';

export const showcaseRouter = buildShowcaseRouter({
  registry: SHOWCASE_REGISTRY,
  shell: ShowcaseShell,
  overview: OverviewPage,
  notFound: NotFoundPage,
});
