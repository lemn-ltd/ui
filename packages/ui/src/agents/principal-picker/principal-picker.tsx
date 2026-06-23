import { type HTMLAttributes, type ReactElement, useId } from 'react';
import { SegmentedControl, type SegmentedControlSegment } from '../../forms/index.js';
import { Checkbox, InputSelect } from '../../primitives/index.js';
import './principal-picker.css';

/** Built-in roles a principal target can resolve to, mirrored from the capability assignment contract. */
export type PrincipalRole = 'owner' | 'admin' | 'member' | 'viewer';

/** Which kind of principal a capability assignment targets. */
export type PrincipalKind = 'role' | 'team' | 'api_client';

/**
 * UI-local mirror of the capability assignment target discriminated union.
 *
 * Mirrors the `CapabilityAssignmentTarget` domain contract without importing it,
 * so the design system stays free of domain package dependencies.
 */
export type PrincipalTarget =
  | { readonly kind: 'role'; readonly role: PrincipalRole }
  | { readonly kind: 'team'; readonly teamId: string }
  | { readonly kind: 'api_client'; readonly clientId: string };

export interface PrincipalPickerTeam {
  readonly id: string;
  readonly name: string;
}

export interface PrincipalPickerApiClient {
  readonly id: string;
  readonly name: string;
}

export interface PrincipalPickerProps
  extends Omit<HTMLAttributes<HTMLFieldSetElement>, 'onChange'> {
  readonly value: PrincipalTarget | null;
  readonly onChange: (target: PrincipalTarget) => void;

  readonly teams: readonly PrincipalPickerTeam[];
  readonly apiClients: readonly PrincipalPickerApiClient[];

  readonly allowedKinds?: readonly PrincipalKind[];

  readonly disabled?: boolean;
}

const DEFAULT_KINDS: readonly PrincipalKind[] = ['role', 'team', 'api_client'];

const DEFAULT_ROLE: PrincipalRole = 'owner';

const ROLES: readonly PrincipalRole[] = ['owner', 'admin', 'member', 'viewer'];

const ROLE_LABEL: Record<PrincipalRole, string> = {
  owner: 'Owner',
  admin: 'Admin',
  member: 'Member',
  viewer: 'Viewer',
};

const KIND_LABEL: Record<PrincipalKind, string> = {
  role: 'Role',
  team: 'Team',
  api_client: 'API client',
};

function activeKind(
  value: PrincipalTarget | null,
  allowed: readonly PrincipalKind[],
): PrincipalKind {
  if (value && allowed.includes(value.kind)) return value.kind;
  return allowed[0] ?? 'role';
}

function defaultTargetForKind(
  kind: PrincipalKind,
  teams: readonly PrincipalPickerTeam[],
  apiClients: readonly PrincipalPickerApiClient[],
): PrincipalTarget {
  if (kind === 'role') return { kind: 'role', role: DEFAULT_ROLE };
  if (kind === 'team') return { kind: 'team', teamId: teams[0]?.id ?? '' };
  return { kind: 'api_client', clientId: apiClients[0]?.id ?? '' };
}

/**
 * Presentational, controlled picker for a capability assignment target. A
 * segmented control selects the principal kind; the body swaps to the matching
 * selector — the four fixed roles, the team list, or the API client list —
 * composed entirely from existing primitives. Emits a fully-formed
 * `PrincipalTarget` on every change so callers never reconstruct the union.
 */
export function PrincipalPicker({
  value,
  onChange,
  teams,
  apiClients,
  allowedKinds = DEFAULT_KINDS,
  disabled,
  className,
  ...rest
}: PrincipalPickerProps): ReactElement {
  const baseId = useId();
  const kind = activeKind(value, allowedKinds);

  const segments: readonly SegmentedControlSegment[] = allowedKinds.map((allowed) => ({
    value: allowed,
    label: KIND_LABEL[allowed],
  }));

  function selectKind(nextKind: string): void {
    const next = nextKind as PrincipalKind;
    if (next === kind) return;
    onChange(defaultTargetForKind(next, teams, apiClients));
  }

  const roleValue = value?.kind === 'role' ? value.role : '';
  const teamValue = value?.kind === 'team' ? value.teamId : '';
  const clientValue = value?.kind === 'api_client' ? value.clientId : '';

  return (
    <fieldset
      aria-label="Principal target"
      className={['ui-principal-picker', className].filter(Boolean).join(' ')}
      data-kind={kind}
      {...rest}
    >
      {allowedKinds.length > 1 ? (
        <div className="ui-principal-picker__kinds">
          <SegmentedControl
            aria-label="Principal kind"
            disabled={disabled}
            onValueChange={selectKind}
            segments={segments}
            value={kind}
          />
        </div>
      ) : null}

      <div className="ui-principal-picker__body">
        {kind === 'role' ? (
          <div className="ui-principal-picker__roles" role="radiogroup">
            {ROLES.map((role) => (
              <label
                className="ui-principal-picker__role"
                data-selected={role === roleValue ? 'true' : undefined}
                key={role}
              >
                <input
                  checked={role === roleValue}
                  className="ui-principal-picker__role-input"
                  disabled={disabled}
                  name={`${baseId}-role`}
                  onChange={() => onChange({ kind: 'role', role })}
                  type="radio"
                  value={role}
                />
                <span className="ui-principal-picker__role-label">{ROLE_LABEL[role]}</span>
              </label>
            ))}
          </div>
        ) : null}

        {kind === 'team' ? (
          <InputSelect
            aria-label="Team"
            className="ui-principal-picker__select"
            disabled={disabled}
            onValueChange={(teamId) => onChange({ kind: 'team', teamId })}
            options={teams.map((team) => ({ value: team.id, label: team.name }))}
            placeholder="Select a team"
            value={teamValue}
          />
        ) : null}

        {kind === 'api_client' ? (
          <InputSelect
            aria-label="API client"
            className="ui-principal-picker__select"
            disabled={disabled}
            onValueChange={(clientId) => onChange({ kind: 'api_client', clientId })}
            options={apiClients.map((client) => ({ value: client.id, label: client.name }))}
            placeholder="Select an API client"
            value={clientValue}
          />
        ) : null}
      </div>
    </fieldset>
  );
}

export interface TeamMemberPickerMember {
  readonly userId: string;
  readonly displayName: string;
}

export interface TeamMemberPickerProps
  extends Omit<HTMLAttributes<HTMLFieldSetElement>, 'onToggle'> {
  readonly members: readonly TeamMemberPickerMember[];
  readonly selected: readonly string[];
  readonly onToggle: (userId: string) => void;

  readonly disabled?: boolean;
}

/**
 * Presentational, controlled multi-select over the members of a single team.
 * One checkbox row per member; selection is owned by the caller through
 * `selected` and surfaced one id at a time via `onToggle`.
 */
export function TeamMemberPicker({
  members,
  selected,
  onToggle,
  disabled,
  className,
  ...rest
}: TeamMemberPickerProps): ReactElement {
  const baseId = useId();
  const selectedSet = new Set(selected);

  return (
    <fieldset
      aria-label="Team members"
      className={['ui-principal-picker', 'ui-principal-picker--members', className]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    >
      <div className="ui-principal-picker__members">
        {members.map((member) => {
          const id = `${baseId}-${member.userId}`;
          return (
            <label
              className="ui-principal-picker__member"
              data-selected={selectedSet.has(member.userId) ? 'true' : undefined}
              htmlFor={id}
              key={member.userId}
            >
              <Checkbox
                checked={selectedSet.has(member.userId)}
                disabled={disabled}
                id={id}
                onCheckedChange={() => onToggle(member.userId)}
              />
              <span className="ui-principal-picker__member-label">{member.displayName}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
