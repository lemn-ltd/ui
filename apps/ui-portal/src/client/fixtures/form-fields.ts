import type { FieldState } from '@lemn-ltd/ui';

export type FieldKind = 'text' | 'email' | 'select' | 'checkbox' | 'toggle';

export interface FieldOption {
  readonly value: string;
  readonly label: string;
}

export interface FieldDescriptor {
  readonly id: string;
  readonly kind: FieldKind;
  readonly label: string;
  readonly placeholder?: string;
  readonly hint?: string;
  readonly error?: string;
  readonly required?: boolean;
  readonly state: FieldState;
  readonly options?: readonly FieldOption[];
}

/** 9 field descriptors across varied kinds; 2 are marked invalid with error text. */
export const formFields: readonly FieldDescriptor[] = [
  {
    id: 'field-name',
    kind: 'text',
    label: 'Name',
    placeholder: 'Enter a name',
    hint: 'Shown to other members.',
    required: true,
    state: 'default',
  },
  {
    id: 'field-email',
    kind: 'email',
    label: 'Email',
    placeholder: 'name@example.com',
    error: 'Enter a valid email address.',
    required: true,
    state: 'invalid',
  },
  {
    id: 'field-handle',
    kind: 'text',
    label: 'Handle',
    placeholder: 'short-handle',
    error: 'This handle is already taken.',
    state: 'invalid',
  },
  {
    id: 'field-role',
    kind: 'select',
    label: 'Role',
    state: 'default',
    options: [
      { value: 'viewer', label: 'Viewer' },
      { value: 'editor', label: 'Editor' },
      { value: 'admin', label: 'Admin' },
    ],
  },
  {
    id: 'field-visibility',
    kind: 'select',
    label: 'Visibility',
    hint: 'Controls who can find this item.',
    state: 'default',
    options: [
      { value: 'private', label: 'Private' },
      { value: 'team', label: 'Team' },
      { value: 'public', label: 'Public' },
    ],
  },
  {
    id: 'field-terms',
    kind: 'checkbox',
    label: 'Accept the terms',
    hint: 'Required before continuing.',
    required: true,
    state: 'default',
  },
  {
    id: 'field-newsletter',
    kind: 'checkbox',
    label: 'Subscribe to updates',
    state: 'default',
  },
  {
    id: 'field-notifications',
    kind: 'toggle',
    label: 'Enable notifications',
    hint: 'Receive a message when activity occurs.',
    state: 'default',
  },
  {
    id: 'field-archived',
    kind: 'toggle',
    label: 'Show archived',
    state: 'disabled',
  },
];
