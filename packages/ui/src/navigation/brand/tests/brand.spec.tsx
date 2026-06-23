import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { ScreenShell } from '../../../layout/screen-shell/screen-shell.js';
import { Sidebar } from '../../sidebar/sidebar.js';
import { Brand } from '../brand.js';

describe('Brand', () => {
  afterEach(() => cleanup());

  it('renders the full name when expanded', () => {
    const { getByText } = render(<Brand name="Design System" />);
    expect(getByText('Design System')).not.toBeNull();
  });

  it('renders derived initials inside a rail shell', () => {
    const { getByText, queryByText } = render(
      <ScreenShell defaultSidebarMode="rail" sidebar={<Brand name="Design System" />}>
        <div />
      </ScreenShell>,
    );
    expect(getByText('DS')).not.toBeNull();
    expect(queryByText('Design System')).toBeNull();
  });

  it('honors an explicit initials override', () => {
    const { getByText } = render(
      <ScreenShell defaultSidebarMode="rail" sidebar={<Brand initials="UI" name="Design System" />}>
        <div />
      </ScreenShell>,
    );
    expect(getByText('UI')).not.toBeNull();
  });

  it('derives initials by code point so emoji names do not split', () => {
    const { getByText } = render(
      <ScreenShell defaultSidebarMode="rail" sidebar={<Brand name="🚀 Rocket" />}>
        <div />
      </ScreenShell>,
    );
    expect(getByText('🚀R')).not.toBeNull();
  });

  it('inherits the rail mark from an enclosing rail Sidebar without a shell', () => {
    const { getByText } = render(
      <Sidebar brand={<Brand name="Design System" />} groups={[]} mode="rail" />,
    );
    expect(getByText('DS')).not.toBeNull();
  });
});
