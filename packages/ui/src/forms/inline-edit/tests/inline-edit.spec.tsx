import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { InlineEdit } from '../inline-edit.js';

const IDS = { display: 'd', edit: 'e', input: 'i', save: 's', cancel: 'c' };

describe('InlineEdit', () => {
  afterEach(() => cleanup());

  it('shows the value with an edit affordance until editing', () => {
    render(
      <InlineEdit displayValue="30 days" kind="number" onSave={vi.fn()} testIds={IDS} value="30" />,
    );
    expect(screen.getByTestId('d').textContent).toBe('30 days');
    expect(screen.queryByTestId('i')).toBeNull();
    expect(screen.getByTestId('e')).toBeDefined();
  });

  it('edits a number value and commits the draft through onSave', async () => {
    const onSave = vi.fn(async () => undefined);
    render(
      <InlineEdit displayValue="30 days" kind="number" onSave={onSave} testIds={IDS} value="30" />,
    );

    fireEvent.click(screen.getByTestId('e'));
    fireEvent.change(screen.getByTestId('i'), { target: { value: '45' } });
    fireEvent.click(screen.getByTestId('s'));

    await waitFor(() => expect(onSave).toHaveBeenCalledWith('45'));
  });

  it('edits a text value and commits the draft through onSave', async () => {
    const onSave = vi.fn(async () => undefined);
    render(
      <InlineEdit
        displayValue="Example workspace"
        kind="text"
        onSave={onSave}
        testIds={IDS}
        value="Example workspace"
      />,
    );

    fireEvent.click(screen.getByTestId('e'));
    fireEvent.change(screen.getByTestId('i'), { target: { value: 'Renamed workspace' } });
    fireEvent.click(screen.getByTestId('s'));

    await waitFor(() => expect(onSave).toHaveBeenCalledWith('Renamed workspace'));
  });

  it('renders the canonical InputSelect on edit for a single-selection value', () => {
    render(
      <InlineEdit
        displayValue="Permissive"
        kind="select"
        onSave={vi.fn()}
        options={[
          { value: 'permissive', label: 'Permissive' },
          { value: 'block', label: 'Block mutations' },
        ]}
        testIds={IDS}
        value="permissive"
      />,
    );

    expect(screen.getByTestId('d').textContent).toBe('Permissive');
    fireEvent.click(screen.getByTestId('e'));

    // The select reuses the design-system InputSelect (a combobox trigger).
    const select = screen.getByRole('combobox', { name: 'Edit' });
    expect(select.className).toContain('ui-input-select');
    expect(select.textContent).toContain('Permissive');
    expect(screen.getByTestId('s')).toBeDefined();
    expect(screen.getByTestId('c')).toBeDefined();
  });

  it('cancels without saving', () => {
    const onSave = vi.fn(async () => undefined);
    render(<InlineEdit displayValue="30" kind="number" onSave={onSave} testIds={IDS} value="30" />);

    fireEvent.click(screen.getByTestId('e'));
    fireEvent.change(screen.getByTestId('i'), { target: { value: '99' } });
    fireEvent.click(screen.getByTestId('c'));

    expect(onSave).not.toHaveBeenCalled();
    expect(screen.queryByTestId('i')).toBeNull();
  });

  it('hides the edit affordance when disabled', () => {
    render(
      <InlineEdit
        disabled
        displayValue="30"
        kind="number"
        onSave={vi.fn()}
        testIds={IDS}
        value="30"
      />,
    );
    expect(screen.queryByTestId('e')).toBeNull();
  });
});
