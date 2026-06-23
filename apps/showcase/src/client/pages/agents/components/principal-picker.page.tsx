import { ComponentPage, ExampleBlock, PropsTable } from '@appranks/showcase-kit';
import { PrincipalPicker, type PrincipalTarget, TeamMemberPicker } from '@appranks/ui';
import { type ReactElement, useState } from 'react';

const TEAMS = [
  { id: 'team-platform', name: 'Platform' },
  { id: 'team-growth', name: 'Growth' },
  { id: 'team-support', name: 'Support' },
] as const;

const API_CLIENTS = [
  { id: 'client-ci', name: 'CI pipeline' },
  { id: 'client-webhook', name: 'Inbound webhook' },
] as const;

const MEMBERS = [
  { userId: 'user-ana', displayName: 'Ana Reyes' },
  { userId: 'user-luis', displayName: 'Luis Park' },
  { userId: 'user-mei', displayName: 'Mei Chen' },
  { userId: 'user-omar', displayName: 'Omar Diaz' },
] as const;

function PrincipalPickerExample(): ReactElement {
  const [target, setTarget] = useState<PrincipalTarget | null>({ kind: 'role', role: 'admin' });
  return (
    <PrincipalPicker apiClients={API_CLIENTS} onChange={setTarget} teams={TEAMS} value={target} />
  );
}

function PrincipalPickerSingleKindExample(): ReactElement {
  const [target, setTarget] = useState<PrincipalTarget | null>(null);
  return (
    <PrincipalPicker
      allowedKinds={['team']}
      apiClients={API_CLIENTS}
      onChange={setTarget}
      teams={TEAMS}
      value={target}
    />
  );
}

function TeamMemberPickerExample(): ReactElement {
  const [selected, setSelected] = useState<readonly string[]>(['user-ana']);
  return (
    <TeamMemberPicker
      members={MEMBERS}
      onToggle={(userId) =>
        setSelected((current) =>
          current.includes(userId) ? current.filter((id) => id !== userId) : [...current, userId],
        )
      }
      selected={selected}
    />
  );
}

function PrincipalPickerPage(): ReactElement {
  return (
    <ComponentPage
      status="beta"
      summary="A controlled picker for a capability assignment target. A segmented control selects the principal kind (role, team, or API client) and the body swaps to the matching selector. TeamMemberPicker is a sibling multi-select over the members of one team."
      title="Principal picker"
    >
      <ExampleBlock
        code={`const [target, setTarget] = useState<PrincipalTarget | null>({
  kind: 'role',
  role: 'admin',
});

<PrincipalPicker
  apiClients={apiClients}
  onChange={setTarget}
  teams={teams}
  value={target}
/>`}
        render={() => <PrincipalPickerExample />}
      />

      <ExampleBlock
        code={`<PrincipalPicker
  allowedKinds={['team']}
  apiClients={apiClients}
  onChange={setTarget}
  teams={teams}
  value={target}
/>`}
        render={() => <PrincipalPickerSingleKindExample />}
      />

      <ExampleBlock
        code={`<TeamMemberPicker
  members={members}
  onToggle={toggleMember}
  selected={selected}
/>`}
        render={() => <TeamMemberPickerExample />}
      />

      <PropsTable
        rows={[
          {
            name: 'value',
            type: 'PrincipalTarget | null',
            description:
              'The selected target as a discriminated union ({ kind: "role" | "team" | "api_client", ... }), or null when unset.',
          },
          {
            name: 'onChange',
            type: '(target: PrincipalTarget) => void',
            description:
              'Emits a fully-formed target on every change, including when the kind switches.',
          },
          {
            name: 'teams',
            type: 'readonly { id: string; name: string }[]',
            description: 'Options shown when the team kind is active.',
          },
          {
            name: 'apiClients',
            type: 'readonly { id: string; name: string }[]',
            description: 'Options shown when the api_client kind is active.',
          },
          {
            name: 'allowedKinds',
            type: "readonly ('role' | 'team' | 'api_client')[]",
            defaultValue: "['role', 'team', 'api_client']",
            description:
              'Restricts the available kinds; the segmented control is hidden when only one is allowed.',
          },
          {
            name: '...rest',
            type: 'HTMLAttributes<HTMLFieldSetElement>',
            description: 'Native fieldset props forwarded to the picker container.',
          },
        ]}
      />

      <PropsTable
        rows={[
          {
            name: 'members',
            type: 'readonly { userId: string; displayName: string }[]',
            description: 'TeamMemberPicker: the members of the team to choose from.',
          },
          {
            name: 'selected',
            type: 'readonly string[]',
            description: 'TeamMemberPicker: currently selected user ids (controlled).',
          },
          {
            name: 'onToggle',
            type: '(userId: string) => void',
            description: 'TeamMemberPicker: emits the user id whose checkbox was toggled.',
          },
        ]}
      />
    </ComponentPage>
  );
}

export default PrincipalPickerPage;
