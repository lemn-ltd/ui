import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { SignInScreen } from '../sign-in-screen.js';

const here = dirname(fileURLToPath(import.meta.url));
const css = readFileSync(join(here, '..', 'sign-in-screen.css'), 'utf8');

describe('SignInScreen', () => {
  afterEach(() => cleanup());

  it('centers a single elevated card under a main landmark with the title', () => {
    const { container } = render(
      <SignInScreen title="Welcome">
        <button type="submit">Sign In</button>
      </SignInScreen>,
    );
    expect(container.querySelector('.ui-signin')?.tagName).toBe('MAIN');
    expect(container.querySelector('.ui-signin__card')?.getAttribute('data-elevated')).toBe('true');
    expect(container.querySelector('.ui-signin__title')?.textContent).toBe('Welcome');
  });

  it('omits the brand, subtitle, and footer slots when not provided', () => {
    const { container } = render(
      <SignInScreen title="Welcome">
        <button type="submit">Sign In</button>
      </SignInScreen>,
    );
    expect(container.querySelector('.ui-signin__brand')).toBeNull();
    expect(container.querySelector('.ui-signin__subtitle')).toBeNull();
    expect(container.querySelector('.ui-signin__footer')).toBeNull();
  });

  it('renders the brand, subtitle, and footer slots when provided', () => {
    const { container, getByText } = render(
      <SignInScreen
        brand={<span>Acme</span>}
        footer={<a href="/reset">Forgot password?</a>}
        subtitle="Sign in to continue"
        title="Welcome"
      >
        <button type="submit">Sign In</button>
      </SignInScreen>,
    );
    expect(getByText('Acme')).not.toBeNull();
    expect(container.querySelector('.ui-signin__subtitle')?.textContent).toBe(
      'Sign in to continue',
    );
    expect(getByText('Forgot password?')).not.toBeNull();
  });

  it('renders app identity with a service mark and accent-colored app name', () => {
    const { container, getByText } = render(
      <SignInScreen
        appAccent="#7c3aed"
        appMarkSvg="<rect width='32' height='32' rx='7' fill='#7c3aed' />"
        appName="Control Center"
        brand={<span>Legacy brand</span>}
      >
        <button type="submit">Sign In</button>
      </SignInScreen>,
    );

    expect(container.querySelector('.ui-signin__brand')).toBeNull();
    expect(container.querySelector('svg.ui-signin__app-mark[data-mark="robot"]')).not.toBeNull();
    expect(container.querySelector('.ui-signin__app-identity')?.getAttribute('style')).toContain(
      '--ui-signin-app-accent: #7c3aed',
    );
    expect(getByText('Control Center').tagName).toBe('H1');
    expect(container.querySelector('.ui-signin__header')).toBeNull();
  });

  it('lets the service mark robot ink follow the sign-in background token', () => {
    const markRule = css.match(/\.ui-signin__app-mark\s*{([^}]*)}/)?.[1];

    expect(markRule).toContain('--service-mark-ink: var(--bg)');
  });

  it('wires onSubmit to the form and spreads rest onto the root', () => {
    let submitted = 0;
    const { container } = render(
      <SignInScreen
        data-testid="signin"
        title="Welcome"
        onSubmit={(event) => {
          event.preventDefault();
          submitted += 1;
        }}
      >
        <button type="submit">Sign In</button>
      </SignInScreen>,
    );
    const root = container.querySelector('[data-testid="signin"]');
    expect(root?.classList.contains('ui-signin')).toBe(true);

    const form = container.querySelector('.ui-signin__form');
    fireEvent.submit(form as HTMLFormElement);
    expect(submitted).toBe(1);
  });
});
