import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { DockPanel, type DockTab } from '../dock-panel.js';

const TABS: readonly DockTab[] = [
  { id: 'preview', label: 'Preview', icon: 'monitor', content: <div>preview pane</div> },
  { id: 'code', label: 'Code', icon: 'code', content: <div>code pane</div> },
];

describe('DockPanel', () => {
  afterEach(() => cleanup());

  it('renders the tab header, controls, and the first tab body by default', () => {
    const { getByText, getByLabelText } = render(<DockPanel tabs={TABS} />);
    expect(getByText('Preview')).not.toBeNull();
    expect(getByText('Code')).not.toBeNull();
    expect(getByText('preview pane')).not.toBeNull();
    expect(getByLabelText('Maximize panel')).not.toBeNull();
    expect(getByLabelText('Hide panel')).not.toBeNull();
  });
});
