import { ComponentPage, ExampleBlock, PropsTable } from '@appranks/showcase-kit';
import {
  CapabilityMatrix,
  type MatrixCapability,
  type MatrixCell,
  type MatrixTarget,
} from '@lemn-ltd/ui';
import type { ReactElement } from 'react';

const CAPABILITIES: readonly MatrixCapability[] = [
  { capabilityRef: 'fs.read', name: 'Read workspace files', risk: 'low' },
  { capabilityRef: 'fs.write', name: 'Write workspace files', risk: 'medium', drift: 'added' },
  {
    capabilityRef: 'shell.exec',
    name: 'Execute shell commands',
    risk: 'high',
    drift: 'surface_changed',
  },
  {
    capabilityRef: 'secrets.read',
    name: 'Read credential vault',
    risk: 'critical',
    drift: 'credential_revoked',
  },
];

const TARGETS: readonly MatrixTarget[] = [
  { key: 'role.admin', label: 'Admin', kind: 'role' },
  { key: 'team.platform', label: 'Platform', kind: 'team' },
  { key: 'client.ci', label: 'CI runner', kind: 'api_client' },
];

const CELLS: readonly MatrixCell[] = [
  { capabilityRef: 'fs.read', targetKey: 'role.admin', state: 'granted' },
  { capabilityRef: 'fs.read', targetKey: 'team.platform', state: 'inherited' },
  { capabilityRef: 'fs.read', targetKey: 'client.ci', state: 'assigned' },
  { capabilityRef: 'fs.write', targetKey: 'role.admin', state: 'granted' },
  { capabilityRef: 'fs.write', targetKey: 'team.platform', state: 'assigned' },
  { capabilityRef: 'fs.write', targetKey: 'client.ci', state: 'none' },
  { capabilityRef: 'shell.exec', targetKey: 'role.admin', state: 'granted' },
  { capabilityRef: 'shell.exec', targetKey: 'team.platform', state: 'none' },
  { capabilityRef: 'shell.exec', targetKey: 'client.ci', state: 'assigned' },
  { capabilityRef: 'secrets.read', targetKey: 'role.admin', state: 'inherited' },
  { capabilityRef: 'secrets.read', targetKey: 'team.platform', state: 'none' },
  { capabilityRef: 'secrets.read', targetKey: 'client.ci', state: 'none' },
];

function CapabilityMatrixPage(): ReactElement {
  return (
    <ComponentPage
      status="beta"
      summary="A who-can-what grid: capability rows × target columns. Each row leads with the capability identity (name, reused capability risk and drift chips, mono ref); each cell projects a grant state through an icon or dot."
      title="Capability matrix"
    >
      <ExampleBlock
        code={`<CapabilityMatrix
  capabilities={capabilities}
  targets={targets}
  cells={cells}
  onCellClick={(capabilityRef, targetKey) => grant(capabilityRef, targetKey)}
  onCapabilityClick={(capabilityRef) => inspect(capabilityRef)}
/>`}
        render={() => (
          <CapabilityMatrix capabilities={CAPABILITIES} cells={CELLS} targets={TARGETS} />
        )}
      />

      <PropsTable
        rows={[
          {
            name: 'capabilities',
            type: 'readonly MatrixCapability[]',
            description:
              'Capability rows; each carries a ref, name, risk level, and optional drift state shown via reused CapabilityChips.',
          },
          {
            name: 'targets',
            type: 'readonly MatrixTarget[]',
            description: 'Target columns (role, team, or api_client) compared against each row.',
          },
          {
            name: 'cells',
            type: 'readonly MatrixCell[]',
            description:
              'Grant states keyed by capabilityRef × targetKey. Missing intersections render as "none".',
          },
          {
            name: 'onCellClick',
            type: '(capabilityRef, targetKey) => void',
            description: 'Optional handler for a cell; makes intersections interactive when set.',
          },
          {
            name: 'onCapabilityClick',
            type: '(capabilityRef) => void',
            description: 'Optional handler for a capability row header; makes the row clickable.',
          },
        ]}
      />
    </ComponentPage>
  );
}

export default CapabilityMatrixPage;
