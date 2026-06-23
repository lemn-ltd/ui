import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { JsonViewer } from '../json-viewer.js';

const here = dirname(fileURLToPath(import.meta.url));
const css = readFileSync(join(here, '..', 'json-viewer.css'), 'utf8');

describe('JsonViewer', () => {
  afterEach(() => cleanup());

  it('renders keys, strings, and numbers with their tones', () => {
    const { container } = render(<JsonViewer data={{ name: 'a', count: 3 }} />);
    expect(container.querySelector('.ui-json-viewer__key')?.textContent).toBe('"name"');
    expect(container.querySelector('.ui-json-viewer__string')?.textContent).toBe('"a"');
    expect(container.querySelector('.ui-json-viewer__number')?.textContent).toBe('3');
  });

  it('collapses and expands a node on toggle', () => {
    const { container } = render(<JsonViewer data={{ nested: { value: 1 } }} defaultExpanded />);
    const nestedToggle = container.querySelectorAll('.ui-json-viewer__toggle')[1] as HTMLElement;
    const node = nestedToggle.closest('.ui-json-viewer__node') as HTMLElement;

    expect(node.getAttribute('data-expanded')).toBe('true');
    fireEvent.click(nestedToggle);
    expect(node.getAttribute('data-expanded')).toBe('false');
  });

  it('keeps closing punctuation aligned with the opening punctuation column', () => {
    const { container } = render(<JsonViewer data={{ nested: { value: 1 } }} defaultExpanded />);
    const closingRows = container.querySelectorAll('.ui-json-viewer__row--closing');
    const closingRule = css.match(/\.ui-json-viewer__row--closing\s*{([^}]*)}/)?.[1];

    expect(closingRows.length).toBe(2);
    expect(closingRule).toBeTruthy();
    expect(closingRule).toContain('padding-left: 0');
  });
});
