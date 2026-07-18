export interface CodeSample {
  readonly id: string;
  readonly variant: 'command' | 'token' | 'inline';
  readonly label: string;
  readonly value: string;
}

/** One sample per code-block variant for the demo. */
export const commandSample: CodeSample = {
  id: 'command',
  variant: 'command',
  label: 'Install',
  value: 'npm install --save-dev example-cli',
};

export const tokenSample: CodeSample = {
  id: 'token',
  variant: 'token',
  label: 'API token',
  value: 'tok_3f9a2c7d8e1b4056a9c2d3e4f5061728',
};

export const inlineSample: CodeSample = {
  id: 'inline',
  variant: 'inline',
  label: 'Session ID',
  value: '442f62d5-a825-4f47-8ea4-bdd6789e8b0e',
};
