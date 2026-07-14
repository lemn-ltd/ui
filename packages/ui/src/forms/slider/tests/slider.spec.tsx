import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Slider } from '../slider.js';

describe('Slider', () => {
  afterEach(cleanup);

  it('renders one accessible thumb and formatted value', () => {
    const { getByRole, getByText } = render(
      <Slider
        aria-labels={['Volume']}
        defaultValue={[40]}
        valueFormatter={(value) => `${value}%`}
      />,
    );
    expect(getByRole('slider', { name: 'Volume' }).getAttribute('aria-valuetext')).toBe('40%');
    expect(getByText('40%')).toBeTruthy();
  });

  it('supports two controlled thumbs and keyboard changes', () => {
    const onValueChange = vi.fn();
    const { getByRole } = render(
      <Slider
        aria-labels={['Minimum price', 'Maximum price']}
        onValueChange={onValueChange}
        value={[20, 80]}
      />,
    );
    fireEvent.keyDown(getByRole('slider', { name: 'Minimum price' }), { key: 'ArrowRight' });
    expect(onValueChange).toHaveBeenCalledWith([21, 80]);
  });

  it('rejects values without a matching accessible label', () => {
    expect(() =>
      render(<Slider aria-labels={['Only one']} value={[10, 20]} />),
    ).toThrow('one accessible label per thumb');
  });
});
