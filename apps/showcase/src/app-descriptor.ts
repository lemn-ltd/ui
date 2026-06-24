export interface AppDescriptor {
  readonly name: string;
  readonly displayName: string;
  readonly accent: string;
}

export const uiShowcaseAppDescriptor: AppDescriptor = {
  name: 'ui-showcase',
  displayName: 'Showcase - UI',
  accent: '#db2777',
};
