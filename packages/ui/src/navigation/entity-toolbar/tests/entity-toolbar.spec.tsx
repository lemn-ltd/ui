import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { EntityToolbar } from '../entity-toolbar.js';

describe('EntityToolbar', () => {
  afterEach(() => cleanup());

  it('renders nothing when every slot is empty', () => {
    const { container } = render(<EntityToolbar />);
    expect(container.firstChild).toBeNull();
    expect(container.querySelector('.ui-entity-toolbar')).toBeNull();
  });

  it('renders the toolbar with the identity slot when only identity is provided', () => {
    const { container, getByTestId } = render(
      <EntityToolbar identity={<div data-testid="identity" />} />,
    );
    expect(container.querySelector('.ui-entity-toolbar')).not.toBeNull();
    expect(getByTestId('identity')).not.toBeNull();
  });

  it('renders the toolbar with the actions slot when only actions is provided', () => {
    const { container, getByTestId } = render(
      <EntityToolbar actions={<div data-testid="actions" />} />,
    );
    expect(container.querySelector('.ui-entity-toolbar')).not.toBeNull();
    expect(getByTestId('actions')).not.toBeNull();
  });
});
