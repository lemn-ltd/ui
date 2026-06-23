import type { ReactElement } from 'react';
import { RouterProvider } from 'react-router-dom';
import { showcaseRouter } from './router/showcase-router';

export function UiShowcaseApp(): ReactElement {
  return <RouterProvider router={showcaseRouter} />;
}
