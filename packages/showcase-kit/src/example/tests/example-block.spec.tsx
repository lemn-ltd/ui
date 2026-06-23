import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ExampleBlock } from '../example-block.js';

describe('ExampleBlock', () => {
  it('switches between rendered preview and code', () => {
    render(
      <ExampleBlock
        code="<Button>Save</Button>"
        render={() => <button type="button">Save</button>}
      />,
    );

    expect(screen.getByRole('button', { name: 'Save' })).toBeDefined();
    fireEvent.mouseDown(screen.getByRole('tab', { name: 'Code' }), { button: 0 });

    expect(screen.getByText('<Button>Save</Button>')).toBeDefined();
  });
});
