import { lazy } from 'react';
import { componentEntry } from '../component-entry.js';
import type { ShowcaseEntry } from '../showcase-types.js';

const SelectNativePage = lazy(
  () => import('../../pages/core/components/select-native.page.js'),
);
const RadioCardGroupPage = lazy(
  () => import('../../pages/core/components/radio-card-group.page.js'),
);
const ToggleGroupPage = lazy(() => import('../../pages/core/components/toggle-group.page.js'));
const SliderPage = lazy(() => import('../../pages/core/components/slider.page.js'));
const DatePickerPage = lazy(() => import('../../pages/core/components/date-picker.page.js'));
const DateRangePickerPage = lazy(
  () => import('../../pages/core/components/date-range-picker.page.js'),
);
const TabNavigationPage = lazy(
  () => import('../../pages/core/components/tab-navigation.page.js'),
);
const SeparatorPage = lazy(() => import('../../pages/core/components/separator.page.js'));

export const capabilityExpansionEntries: ShowcaseEntry[] = [
  componentEntry('select-native', () => <SelectNativePage />),
  componentEntry('radio-card-group', () => <RadioCardGroupPage />),
  componentEntry('toggle-group', () => <ToggleGroupPage />),
  componentEntry('slider', () => <SliderPage />),
  componentEntry('date-picker', () => <DatePickerPage />),
  componentEntry('date-range-picker', () => <DateRangePickerPage />),
  componentEntry('tab-navigation', () => <TabNavigationPage />),
  componentEntry('separator', () => <SeparatorPage />),
];
