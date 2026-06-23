import type {
  CSSProperties,
  FormEventHandler,
  HTMLAttributes,
  ReactElement,
  ReactNode,
} from 'react';
import { Card } from '../../data-display/card/card.js';
import './sign-in-screen.css';

export interface SignInScreenProps extends Omit<HTMLAttributes<HTMLElement>, 'title' | 'onSubmit'> {
  readonly title?: ReactNode;

  readonly subtitle?: ReactNode;
  readonly brand?: ReactNode;
  readonly appName?: string;
  readonly appAccent?: string;
  /** Trusted SVG inner markup for a `0 0 32 32` app mark. */
  readonly appMarkSvg?: string;
  readonly footer?: ReactNode;

  readonly onSubmit?: FormEventHandler<HTMLFormElement>;
  readonly children: ReactNode;
}

type AppIdentityProps = Pick<SignInScreenProps, 'appAccent' | 'appMarkSvg' | 'appName'>;
type HeaderProps = Pick<SignInScreenProps, 'appName' | 'subtitle' | 'title'>;

function renderAppIdentity({
  appAccent,
  appMarkSvg,
  appName,
}: AppIdentityProps): ReactElement | null {
  if (!appName && !appMarkSvg) return null;

  const style = appAccent ? ({ '--ui-signin-app-accent': appAccent } as CSSProperties) : undefined;

  return (
    <div className="ui-signin__app-identity" style={style}>
      {appMarkSvg ? (
        <svg
          aria-hidden="true"
          className="ui-signin__app-mark"
          data-mark="robot"
          viewBox="0 0 32 32"
          xmlns="http://www.w3.org/2000/svg"
          // biome-ignore lint/style/useNamingConvention: React requires the __html key.
          dangerouslySetInnerHTML={{ __html: appMarkSvg }}
        />
      ) : null}
      {appName ? <h1 className="ui-signin__app-name">{appName}</h1> : null}
    </div>
  );
}

function renderTitle(title: ReactNode, appName: string | undefined): ReactElement {
  return appName ? (
    <h2 className="ui-signin__title">{title}</h2>
  ) : (
    <h1 className="ui-signin__title">{title}</h1>
  );
}

function renderHeader({ appName, subtitle, title }: HeaderProps): ReactElement | null {
  if (!title && !subtitle) return null;

  return (
    <header className="ui-signin__header">
      {title ? renderTitle(title, appName) : null}
      {subtitle ? <p className="ui-signin__subtitle">{subtitle}</p> : null}
    </header>
  );
}

function renderBrand(brand: ReactNode): ReactElement | null {
  return brand ? <div className="ui-signin__brand">{brand}</div> : null;
}

/**
 * The centered single-card auth screen: a full-viewport surface holding one
 * elevated Card with an optional app identity, a centered title/subtitle header,
 * and a vertical form whose submit button spans full width. The caller owns the
 * form controls (passed as children) and the submit handler, so field wiring,
 * validity, and error rendering stay with the consuming app.
 */
export function SignInScreen({
  title,
  subtitle,
  brand,
  appName,
  appAccent,
  appMarkSvg,
  footer,
  onSubmit,
  className,
  children,
  ...rest
}: SignInScreenProps): ReactElement {
  const appIdentity = renderAppIdentity({ appAccent, appMarkSvg, appName });
  const header = renderHeader({ appName, subtitle, title });

  return (
    <main className={['ui-signin', className].filter(Boolean).join(' ')} {...rest}>
      <Card className="ui-signin__card" elevated>
        {appIdentity ?? renderBrand(brand)}

        {header}

        <form className="ui-signin__form" onSubmit={onSubmit}>
          {children}
        </form>

        {footer ? <div className="ui-signin__footer">{footer}</div> : null}
      </Card>
    </main>
  );
}
