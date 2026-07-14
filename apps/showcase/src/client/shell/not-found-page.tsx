import { Button, ContentLayout } from '@lemn-ltd/ui';
import type { ReactElement } from 'react';
import { useNavigate } from 'react-router-dom';

export function NotFoundPage(): ReactElement {
  const navigate = useNavigate();

  return (
    <ContentLayout>
      <div className="showcase-not-found">
        <p className="showcase-not-found__code">404</p>
        <h1 className="showcase-not-found__title">Page not found</h1>
        <p className="showcase-not-found__detail">
          The page you are looking for is not in the catalog.
        </p>
        <Button onClick={() => navigate('/')} variant="secondary">
          Back to overview
        </Button>
      </div>
    </ContentLayout>
  );
}
