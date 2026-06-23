import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { FormDialog } from '../form-dialog.js';

describe('FormDialog', () => {
  afterEach(() => cleanup());

  it('renders the title, body, and a Cancel + Submit footer when open', () => {
    render(
      <FormDialog defaultOpen onSubmit={() => {}} submitLabel="Create" title="New item">
        <p>Field rows go here</p>
      </FormDialog>,
    );
    expect(document.querySelector('.ui-dialog__title')?.textContent).toBe('New item');
    expect(document.querySelector('.ui-form-dialog__form')?.textContent).toContain(
      'Field rows go here',
    );
    const labels = Array.from(document.querySelectorAll('.ui-dialog__footer button')).map(
      (button) => button.textContent,
    );
    expect(labels).toEqual(['Cancel', 'Create']);
  });

  it('wires the footer submit button to the body form and calls onSubmit on submit', () => {
    const onSubmit = vi.fn();
    render(
      <FormDialog defaultOpen onSubmit={onSubmit} title="New item">
        <p>body</p>
      </FormDialog>,
    );
    const form = document.querySelector('.ui-form-dialog__form') as HTMLFormElement;
    const submit = document.querySelector('button[type="submit"]') as HTMLButtonElement;
    expect(submit.getAttribute('form')).toBe(form.id);

    fireEvent.submit(form);
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('disables submit, shows a spinner, and ignores submit while submitting', () => {
    const onSubmit = vi.fn();
    render(
      <FormDialog defaultOpen onSubmit={onSubmit} submitting title="New item">
        <p>body</p>
      </FormDialog>,
    );
    const submit = document.querySelector('button[type="submit"]') as HTMLButtonElement;
    expect(submit.disabled).toBe(true);
    expect(document.querySelector('.ui-spinner')).not.toBeNull();

    fireEvent.submit(document.querySelector('.ui-form-dialog__form') as HTMLFormElement);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('renders the danger error-summary banner when error is set', () => {
    render(
      <FormDialog defaultOpen error="Name is required." onSubmit={() => {}} title="New item">
        <p>body</p>
      </FormDialog>,
    );
    const banner = document.querySelector('.ui-info-banner');
    expect(banner?.getAttribute('data-variant')).toBe('danger');
    expect(banner?.textContent).toContain('Name is required.');
    // The summary closes the scrolling form body, after the fields.
    const form = banner?.closest('.ui-form-dialog__form');
    expect(form).not.toBeNull();
    expect(form?.lastElementChild).toBe(banner);
  });

  it('calls onCancel from the footer cancel button', () => {
    const onCancel = vi.fn();
    render(
      <FormDialog defaultOpen onCancel={onCancel} onSubmit={() => {}} title="New item">
        <p>body</p>
      </FormDialog>,
    );
    const cancel = Array.from(document.querySelectorAll('.ui-dialog__footer button')).find(
      (button) => button.textContent === 'Cancel',
    ) as HTMLButtonElement;
    fireEvent.click(cancel);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
