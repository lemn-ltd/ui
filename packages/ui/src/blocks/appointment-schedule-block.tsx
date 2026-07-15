import type { ReactElement, ReactNode } from 'react';
import { Card } from '../data-display/card/card.js';
import { EmptyState } from '../data-display/empty-state/empty-state.js';
import { Alert } from '../feedback/alert/alert.js';
import { Skeleton } from '../feedback/skeleton/skeleton.js';
import { Badge, type BadgeTone } from '../primitives/badge/badge.js';
import { Button } from '../primitives/button/button.js';
import './blocks.css';

export type AppointmentScheduleStatus = 'cancelled' | 'confirmed' | 'pending' | 'waitlist';

export interface AppointmentScheduleItem {
  readonly id: string;
  readonly patient: ReactNode;
  readonly practitioner?: ReactNode;
  readonly service: ReactNode;
  readonly startLabel: ReactNode;
  readonly status: AppointmentScheduleStatus;
}

export interface AppointmentScheduleBlockProps {
  readonly error?: string;
  readonly items: readonly AppointmentScheduleItem[];
  readonly loading?: boolean;
  readonly onOpen?: (id: string) => void;
  readonly title?: ReactNode;
}

const STATUS_TONE: Record<AppointmentScheduleStatus, BadgeTone> = {
  cancelled: 'danger',
  confirmed: 'success',
  pending: 'warn',
  waitlist: 'info',
};

/** Curated schedule block for appointment-based products. */
export function AppointmentScheduleBlock({
  error,
  items,
  loading = false,
  onOpen,
  title = 'Upcoming appointments',
}: AppointmentScheduleBlockProps): ReactElement {
  return (
    <section aria-busy={loading || undefined} className="ui-block ui-appointment-schedule-block">
      <header className="ui-block__header"><h2>{title}</h2></header>
      {error ? <Alert message={error} title="Schedule unavailable" variant="error" /> : null}
      {loading ? (
        <div aria-label="Loading appointments" className="ui-appointment-schedule-block__list">
          {Array.from({ length: 3 }, (_, index) => <Skeleton key={index} shape="rect" />)}
        </div>
      ) : items.length === 0 ? (
        <Card><EmptyState description="New bookings will appear here." icon="clock" title="No upcoming appointments" /></Card>
      ) : (
        <ol className="ui-appointment-schedule-block__list">
          {items.map((item) => (
            <li key={item.id}>
              <Card
                footer={onOpen ? <Button onClick={() => onOpen(item.id)} size="sm" variant="outline">View appointment</Button> : undefined}
                title={<div className="ui-appointment-schedule-block__title"><strong>{item.patient}</strong><Badge tone={STATUS_TONE[item.status]}>{item.status}</Badge></div>}
              >
                <div className="ui-appointment-schedule-block__details">
                  <span>{item.startLabel}</span><span>{item.service}</span>{item.practitioner ? <span>{item.practitioner}</span> : null}
                </div>
              </Card>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
