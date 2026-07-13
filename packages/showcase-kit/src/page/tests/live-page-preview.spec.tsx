import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ExampleBlock } from '../../example/example-block.js';
import { ShowcaseRenderModeProvider } from '../../preview/render-mode.js';
import { ComponentPage } from '../component-page.js';
import { FoundationPage } from '../foundation-page.js';

describe('live page previews', () => {
  it('selects the first canonical ExampleBlock from a component page', () => {
    render(
      <ShowcaseRenderModeProvider mode="playground">
        <ComponentPage summary="Summary" title="Button">
          <p>Supporting documentation</p>
          <ExampleBlock
            code="<button>Canonical</button>"
            render={() => <button type="button">Canonical</button>}
          />
          <ExampleBlock
            code="<button>Secondary</button>"
            render={() => <button type="button">Secondary</button>}
          />
        </ComponentPage>
      </ShowcaseRenderModeProvider>,
    );

    expect(screen.getByRole('button', { name: 'Canonical' })).toBeDefined();
    expect(screen.queryByRole('button', { name: 'Secondary' })).toBeNull();
    expect(screen.queryByText('Supporting documentation')).toBeNull();
    expect(screen.queryByRole('heading', { name: 'Button' })).toBeNull();
  });

  it('selects the first token group from a foundation page', () => {
    render(
      <ShowcaseRenderModeProvider mode="card">
        <FoundationPage caption="Token reference" title="Colors">
          <div>Canonical color group</div>
          <div>Secondary color group</div>
        </FoundationPage>
      </ShowcaseRenderModeProvider>,
    );

    expect(screen.getByText('Canonical color group')).toBeDefined();
    expect(screen.queryByText('Secondary color group')).toBeNull();
    expect(screen.queryByRole('heading', { name: 'Colors' })).toBeNull();
  });
});
