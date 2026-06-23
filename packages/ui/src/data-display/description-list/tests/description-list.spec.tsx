import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DescriptionList, DescriptionRow } from '../description-list.js';

describe('DescriptionList', () => {
  it('renders rows as dt/dd pairs inside a dl', () => {
    render(
      <DescriptionList>
        <DescriptionRow label="Connector URL">https://mcp.example/sse</DescriptionRow>
        <DescriptionRow label="Auth">OAuth</DescriptionRow>
      </DescriptionList>,
    );

    expect(screen.getByText('Connector URL').tagName).toBe('DT');
    expect(screen.getByText('OAuth').tagName).toBe('DD');
    expect(screen.getByText('Auth').closest('dl')).not.toBeNull();
  });

  it('accepts arbitrary value content', () => {
    render(
      <DescriptionList>
        <DescriptionRow label="Scopes">
          <span>channels:read</span>
          <span>chat:write</span>
        </DescriptionRow>
      </DescriptionList>,
    );

    expect(screen.getByText('channels:read')).toBeDefined();
    expect(screen.getByText('chat:write')).toBeDefined();
  });

  it('forwards className to the list and the row', () => {
    render(
      <DescriptionList className="custom-list" data-testid="list">
        <DescriptionRow className="custom-row" data-testid="row" label="Auth">
          OAuth
        </DescriptionRow>
      </DescriptionList>,
    );

    expect(screen.getByTestId('list').className).toContain('ui-description-list');
    expect(screen.getByTestId('list').className).toContain('custom-list');
    expect(screen.getByTestId('row').className).toContain('ui-description-list__row');
    expect(screen.getByTestId('row').className).toContain('custom-row');
  });
});
