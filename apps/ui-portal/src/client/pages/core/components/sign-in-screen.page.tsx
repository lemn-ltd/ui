import { ComponentPage, ExampleBlock, PropsTable } from '@portal/catalog-kit';
import { Button, Field, InfoBanner, Input, SignInScreen } from '@lemn-ltd/ui';
import type { CSSProperties, ReactElement } from 'react';

// The screen fills the viewport; inside the docs it is capped and framed so it
// reads as a preview rather than re-centering the whole page. An inline
// min-height overrides the component's 100vh for the embedded example.
const FRAME: CSSProperties = {
  border: '1px solid var(--lemn-color-border)',
  borderRadius: 'var(--lemn-radius-large)',
  overflow: 'hidden',
};

const INSET: CSSProperties = { minHeight: 460 };
const EXAMPLE_ACCENT = '#7c3aed';

function renderServiceMark(accent: string): string {
  return [
    `<rect x="5" y="5" width="22" height="22" rx="7" fill="${accent}" opacity=".14" />`,
    `<path d="M10 17.5h12M12 12.5h8M13 22h6" stroke="${accent}" stroke-width="2" stroke-linecap="round" />`,
    `<circle cx="11" cy="9" r="2" fill="${accent}" />`,
    `<circle cx="21" cy="9" r="2" fill="${accent}" />`,
  ].join('');
}

function SignInScreenPage(): ReactElement {
  return (
    <ComponentPage
      status="stable"
      summary="The centered single-card auth screen. It owns the full-viewport surface, the elevated card, the brand row, the title/subtitle header, and a vertical form whose submit button spans full width. The caller passes the fields, error banner, and submit button as children and owns the submit handler."
      title="Sign-in screen"
    >
      <ExampleBlock
        code={`<SignInScreen
  appName="Control Center"
  appAccent="#7c3aed"
  appMarkSvg={renderServiceMark("#7c3aed")}
  onSubmit={handleSubmit}
>
  <Field label="Email">
    {(c) => <Input {...c} type="email" autoComplete="email" />}
  </Field>
  <Field label="Password" state="invalid">
    {(c) => <Input {...c} type="password" autoComplete="current-password" />}
  </Field>
  <InfoBanner variant="danger">Incorrect email or password.</InfoBanner>
  <Button type="submit" variant="primary">Sign In</Button>
</SignInScreen>`}
        render={() => (
          <div style={FRAME}>
            <SignInScreen
              appAccent={EXAMPLE_ACCENT}
              appMarkSvg={renderServiceMark(EXAMPLE_ACCENT)}
              appName="Control Center"
              style={INSET}
              onSubmit={(event) => event.preventDefault()}
            >
              <Field label="Email">
                {(control) => (
                  <Input
                    {...control}
                    autoComplete="email"
                    placeholder="name@example.com"
                    type="email"
                  />
                )}
              </Field>
              <Field label="Password" state="invalid">
                {(control) => (
                  <Input
                    {...control}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    type="password"
                  />
                )}
              </Field>
              <InfoBanner variant="danger">Incorrect email or password.</InfoBanner>
              <Button type="submit" variant="primary">
                Sign In
              </Button>
            </SignInScreen>
          </div>
        )}
      />

      <PropsTable
        rows={[
          {
            name: 'title',
            type: 'ReactNode',
            description:
              'Optional card heading; when appName is provided, appName owns the h1 and title renders as a secondary heading.',
          },
          {
            name: 'subtitle',
            type: 'ReactNode',
            description: 'Optional muted line under the title; omitted when not provided.',
          },
          {
            name: 'appName',
            type: 'string',
            description: 'Optional app name rendered below the app mark, colored with appAccent.',
          },
          {
            name: 'appAccent',
            type: 'string',
            description: 'Optional app accent color used for the app name and mark glow.',
          },
          {
            name: 'appMarkSvg',
            type: 'string',
            description:
              'Trusted SVG inner markup for the app mark, typically renderServiceMark(appAccent).',
          },
          {
            name: 'brand',
            type: 'ReactNode',
            description:
              'Legacy centered brand slot above the header; appName/appMarkSvg take precedence.',
          },
          {
            name: 'footer',
            type: 'ReactNode',
            description:
              'Optional centered content below the form, e.g. a "Forgot password?" link.',
          },
          {
            name: 'onSubmit',
            type: 'FormEventHandler<HTMLFormElement>',
            description: 'Submit handler wired to the internal form element.',
          },
          {
            name: 'children',
            type: 'ReactNode',
            description:
              'The form controls: fields, an error banner, and the submit button. The direct submit button spans full width.',
          },
          {
            name: '…rest',
            type: "Omit<HTMLAttributes<HTMLElement>, 'title' | 'onSubmit'>",
            description:
              'Native attributes (className, style, data-testid, …) spread onto the root <main>; an inline min-height overrides the default 100vh.',
          },
        ]}
      />
    </ComponentPage>
  );
}

export default SignInScreenPage;
