import { lazy } from 'react';
import type { ShowcaseEntry } from '../showcase-types.js';

const ColorsPage = lazy(() => import('../../pages/core/foundations/colors.page.js'));
const TypographyPage = lazy(() => import('../../pages/core/foundations/typography.page.js'));
const SpacingPage = lazy(() => import('../../pages/core/foundations/spacing.page.js'));
const ElevationPage = lazy(() => import('../../pages/core/foundations/elevation.page.js'));
const MotionPage = lazy(() => import('../../pages/core/foundations/motion.page.js'));
const IconsPage = lazy(() => import('../../pages/core/foundations/icons.page.js'));

export const foundationsEntries: ShowcaseEntry[] = [
  {
    slug: 'colors',
    title: 'Colors',
    group: 'Foundations',
    kind: 'foundation',
    summary: 'Surface, text, accent, status, and soft-status tokens — resolved per theme.',
    status: 'stable',
    page: () => <ColorsPage />,
  },
  {
    slug: 'typography',
    title: 'Typography',
    group: 'Foundations',
    kind: 'foundation',
    summary: 'Type scale with unitless line-height ratios, weights, and the mono family.',
    status: 'stable',
    page: () => <TypographyPage />,
  },
  {
    slug: 'spacing',
    title: 'Spacing & radii',
    group: 'Foundations',
    kind: 'foundation',
    summary: 'The non-contiguous spacing scale and the four corner radii.',
    status: 'stable',
    page: () => <SpacingPage />,
  },
  {
    slug: 'elevation',
    title: 'Elevation',
    group: 'Foundations',
    kind: 'foundation',
    summary: 'Three elevation levels, shadow-led in Light and border-led in Dark.',
    status: 'stable',
    page: () => <ElevationPage />,
  },
  {
    slug: 'motion',
    title: 'Motion',
    group: 'Foundations',
    kind: 'foundation',
    summary: 'Durations, easings, and loops that go static under reduced motion.',
    status: 'stable',
    page: () => <MotionPage />,
  },
  {
    slug: 'icons',
    title: 'Icons',
    group: 'Foundations',
    kind: 'foundation',
    summary: 'The product-neutral base glyph set the package re-exports.',
    status: 'stable',
    page: () => <IconsPage />,
  },
];
