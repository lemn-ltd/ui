import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AppointmentScheduleBlock } from '../appointment-schedule-block.js';
import { ApprovalQueueBlock } from '../approval-queue-block.js';
import { blockCatalog } from '../block-catalog.js';
import { coreBlockCatalog } from '../core-block-catalog.js';

describe('curated blocks', () => {
  it('has a unique, purpose-specific catalog', () => {
    expect(blockCatalog).toHaveLength(3);
    expect(new Set(blockCatalog.map((entry) => entry.slug)).size).toBe(3);
    expect(blockCatalog.every((entry) => entry.components.length > 0)).toBe(true);
  });

  it('keeps the Core-only catalog free of approval blocks', () => {
    expect(coreBlockCatalog).toHaveLength(2);
    expect(coreBlockCatalog.map((entry) => entry.slug)).toEqual([
      'dashboard-overview',
      'appointment-schedule',
    ]);
  });

  it('renders the appointment empty state without inventing data', () => {
    const { getByText } = render(<AppointmentScheduleBlock items={[]} />);
    expect(getByText('No upcoming appointments')).toBeTruthy();
  });

  it('routes approval decisions to the host', () => {
    const onApprove = vi.fn();
    const { getByRole } = render(
      <ApprovalQueueBlock
        onApprove={onApprove}
        onReject={vi.fn()}
        requests={[{ hitlRequestId: 'approval-1', kind: 'approval', mode: 'confirmation', prompt: 'Publish revision?' }]}
      />,
    );
    fireEvent.click(getByRole('button', { name: 'Approve' }));
    expect(onApprove).toHaveBeenCalledWith('approval-1');
  });
});
