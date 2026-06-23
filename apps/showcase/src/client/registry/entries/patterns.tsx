import { lazy } from 'react';
import type { ShowcaseEntry } from '../showcase-types.js';

const ListTablePage = lazy(() => import('../../pages/core/patterns/list-table.page.js'));
const ListGridPage = lazy(() => import('../../pages/core/patterns/list-grid.page.js'));
const ListSplitPage = lazy(() => import('../../pages/core/patterns/list-split.page.js'));
const DetailPage = lazy(() => import('../../pages/core/patterns/detail.page.js'));
const SettingsFormPage = lazy(() => import('../../pages/core/patterns/settings-form.page.js'));
const DashboardPage = lazy(() => import('../../pages/core/patterns/dashboard.page.js'));
const StatesPage = lazy(() => import('../../pages/core/patterns/states.page.js'));
const ResponsivePage = lazy(() => import('../../pages/core/patterns/responsive.page.js'));
const ResourceManagerPage = lazy(
  () => import('../../pages/core/patterns/resource-manager.page.js'),
);

export const patternsEntries: ShowcaseEntry[] = [
  {
    slug: 'list-table',
    title: 'List + table',
    group: 'Patterns',
    kind: 'pattern',
    summary:
      'The canonical list screen: shell, page header, filter bar, and a sortable data table.',
    status: 'stable',
    page: () => <ListTablePage />,
  },
  {
    slug: 'list-grid',
    title: 'List + grid',
    group: 'Patterns',
    kind: 'pattern',
    summary: 'A card-grid variant of the list screen wrapping a responsive section grid.',
    status: 'stable',
    page: () => <ListGridPage />,
  },
  {
    slug: 'list-split',
    title: 'List + split',
    group: 'Patterns',
    kind: 'pattern',
    summary: 'A master-detail split with a selectable list and a labeled detail panel.',
    status: 'stable',
    page: () => <ListSplitPage />,
  },
  {
    slug: 'detail',
    title: 'Detail',
    group: 'Patterns',
    kind: 'pattern',
    summary: 'An entity detail screen: toolbar, stats strip, summary panels, and a tab strip.',
    status: 'stable',
    page: () => <DetailPage />,
  },
  {
    slug: 'settings-form',
    title: 'Settings form',
    group: 'Patterns',
    kind: 'pattern',
    summary: 'A settings screen with a drill-in rail, form sections, and a Save footer.',
    status: 'stable',
    page: () => <SettingsFormPage />,
  },
  {
    slug: 'dashboard',
    title: 'Dashboard',
    group: 'Patterns',
    kind: 'pattern',
    summary: 'An overview screen with a stats strip and a section grid of sparkline trend cards.',
    status: 'stable',
    page: () => <DashboardPage />,
  },
  {
    slug: 'states',
    title: 'States',
    group: 'Patterns',
    kind: 'pattern',
    summary: 'The loading, empty, and error states a data surface moves through, side by side.',
    status: 'stable',
    page: () => <StatesPage />,
  },
  {
    slug: 'responsive',
    title: 'Responsive',
    group: 'Patterns',
    kind: 'pattern',
    summary: 'How the shell composition reflows across the 375, 768, and 1280px breakpoints.',
    status: 'stable',
    page: () => <ResponsivePage />,
  },
  {
    slug: 'resource-manager',
    title: 'Resource manager',
    group: 'Patterns',
    kind: 'pattern',
    summary:
      'The end-to-end CRUD screen with a non-invasive default: row kebab (edit/delete), selectable rows for bulk delete, two key filters plus name search, and a create/edit form dialog.',
    status: 'beta',
    page: () => <ResourceManagerPage />,
  },
];
