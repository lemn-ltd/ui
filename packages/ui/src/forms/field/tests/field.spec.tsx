import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { Input } from '../../../primitives/index.js';
import { Field } from '../field.js';

function renderField(props: Partial<Parameters<typeof Field>[0]> = {}) {
  return render(
    <Field hint="A short hint" label="Email" {...props}>
      {({ invalid, ...control }) => <Input invalid={invalid} {...control} />}
    </Field>,
  );
}

describe('Field', () => {
  afterEach(() => cleanup());

  it('associates the label to the control via htmlFor/id', () => {
    renderField();
    const label = document.querySelector('.ui-field__label') as HTMLLabelElement;
    const input = document.querySelector('input') as HTMLInputElement;
    expect(label.htmlFor).toBe(input.id);
    expect(input.id).not.toBe('');
  });

  it('renders the hint by default and no error', () => {
    renderField({ error: 'Required field' });
    const helper = document.querySelector('.ui-field__helper') as HTMLElement;
    expect(helper.textContent).toBe('A short hint');
    expect(helper.getAttribute('data-tone')).toBe('hint');
  });

  it('replaces the hint with the error when invalid', () => {
    renderField({ state: 'invalid', error: 'Required field' });
    const helpers = document.querySelectorAll('.ui-field__helper');
    expect(helpers.length).toBe(1);
    const helper = helpers[0] as HTMLElement;
    expect(helper.textContent).toBe('Required field');
    expect(helper.getAttribute('data-tone')).toBe('error');
  });

  it('wires aria-invalid and aria-describedby on the control when invalid', () => {
    renderField({ state: 'invalid', error: 'Required field' });
    const input = document.querySelector('input') as HTMLInputElement;
    const helper = document.querySelector('.ui-field__helper') as HTMLElement;
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.getAttribute('aria-describedby')).toBe(helper.id);
    expect(input.getAttribute('data-invalid')).toBe('true');
  });

  it('omits aria-invalid in the default state', () => {
    renderField();
    const input = document.querySelector('input') as HTMLInputElement;
    expect(input.getAttribute('aria-invalid')).toBeNull();
  });

  it('forwards the disabled flag and dims the row when disabled', () => {
    renderField({ state: 'disabled' });
    const input = document.querySelector('input') as HTMLInputElement;
    const root = document.querySelector('.ui-field') as HTMLElement;
    expect(input.disabled).toBe(true);
    expect(root.getAttribute('data-state')).toBe('disabled');
  });

  it('renders the required asterisk', () => {
    renderField({ required: true });
    const asterisk = document.querySelector('.ui-field__required');
    expect(asterisk).not.toBeNull();
    expect(asterisk?.textContent).toBe('*');
  });
});
