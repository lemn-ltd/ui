import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Accordion, type AccordionItemData } from '../accordion.js';

const items: AccordionItemData[] = [
  { value: 'one', label: 'Section one', caption: 'First', content: <p>Body one</p> },
  { value: 'two', label: 'Section two', content: <p>Body two</p> },
  { value: 'three', label: 'Section three', content: <p>Body three</p>, disabled: true },
];

describe('Accordion', () => {
  afterEach(() => cleanup());

  it('renders one trigger per item with an optional caption', () => {
    render(<Accordion items={items} />);
    const triggers = document.querySelectorAll('.ui-accordion__trigger');
    expect(triggers.length).toBe(3);
    expect(document.querySelectorAll('.ui-accordion__caption').length).toBe(1);
  });

  it('reflects the open item via [data-state="open"]', () => {
    render(<Accordion defaultValue="one" items={items} />);
    const triggers = document.querySelectorAll('.ui-accordion__trigger');
    expect(triggers[0]?.getAttribute('data-state')).toBe('open');
    expect(triggers[1]?.getAttribute('data-state')).toBe('closed');
  });

  it('opens at most one item in single mode', () => {
    const onValueChange = vi.fn();
    render(<Accordion defaultValue="one" items={items} onValueChange={onValueChange} />);
    const triggers = document.querySelectorAll('.ui-accordion__trigger');
    fireEvent.click(triggers[1] as HTMLElement);
    expect(onValueChange).toHaveBeenLastCalledWith('two');
    expect(triggers[0]?.getAttribute('data-state')).toBe('closed');
    expect(triggers[1]?.getAttribute('data-state')).toBe('open');
  });

  it('keeps several items open in multiple mode', () => {
    render(<Accordion defaultValue={['one', 'two']} items={items} type="multiple" />);
    const open = document.querySelectorAll('.ui-accordion__trigger[data-state="open"]');
    expect(open.length).toBe(2);
  });

  it('disables an item', () => {
    render(<Accordion items={items} />);
    const triggers = document.querySelectorAll('.ui-accordion__trigger');
    expect((triggers[2] as HTMLButtonElement).disabled).toBe(true);
  });

  it('exposes the chevron on every trigger for the rotate transition', () => {
    render(<Accordion items={items} />);
    expect(document.querySelectorAll('.ui-accordion__chevron').length).toBe(3);
  });
});
