export interface AppDescriptor {
  readonly name: string;
  readonly displayName: string;
  readonly accent: string;
}

export const uiPortalAppDescriptor: AppDescriptor = {
  name: 'ui-portal',
  displayName: 'Lemn UI',
  accent: '#0f766e',
};
