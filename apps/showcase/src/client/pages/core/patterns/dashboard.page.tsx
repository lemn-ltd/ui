import { ComponentPage } from '@lemn-ltd/showcase-kit';
import {
  Card,
  ListShell,
  PageHeader,
  SectionGrid,
  Sidebar,
  Sparkline,
  StatsStrip,
  TopBar,
} from '@lemn-ltd/ui';
import type { CSSProperties, ReactElement } from 'react';
import { navGroups, sparklinePoints, stats } from '../../../fixtures';

// A fixed-height bordered frame replicating the screen shell so the dashboard
// reads as a docs preview, not the page's own viewport.
const FRAME: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'auto 1fr',
  height: 640,
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-lg)',
  overflow: 'hidden',
  background: 'var(--bg)',
};

const MAIN: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  minWidth: 0,
};

const CONTENT: CSSProperties = {
  flex: 1,
  minHeight: 0,
  overflow: 'auto',
};

const TREND: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-3)',
};

const TREND_VALUE: CSSProperties = {
  fontSize: 'var(--font-size-display)',
  fontWeight: 600,
  lineHeight: 'var(--line-height-display)',
};

const TREND_CHART: CSSProperties = {
  height: 64,
};

const TRENDS: readonly { id: string; label: string; value: string }[] = [
  { id: 'trend-throughput', label: 'Throughput', value: '8.2k' },
  { id: 'trend-latency', label: 'Latency', value: '128ms' },
  { id: 'trend-errors', label: 'Errors', value: '0.4%' },
];

function DashboardPage(): ReactElement {
  return (
    <ComponentPage
      status="stable"
      summary="An overview screen: the shell wraps a stats strip of headline metrics and a section grid of trend cards, each pairing a value with a sparkline."
      title="Dashboard"
    >
      <div style={FRAME}>
        <Sidebar groups={navGroups} mode="expanded" />
        <div style={MAIN}>
          <TopBar />
          <div style={CONTENT}>
            <ListShell>
              <PageHeader subtitle="Activity across the workspace." title="Overview" />
              <StatsStrip stats={stats} />
              <SectionGrid>
                {TRENDS.map((trend) => (
                  <Card key={trend.id} title={trend.label}>
                    <div style={TREND}>
                      <span style={TREND_VALUE}>{trend.value}</span>
                      <Sparkline points={sparklinePoints} style={TREND_CHART} />
                    </div>
                  </Card>
                ))}
              </SectionGrid>
            </ListShell>
          </div>
        </div>
      </div>
    </ComponentPage>
  );
}

export default DashboardPage;
