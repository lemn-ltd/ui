import type { ReactElement, ReactNode } from 'react';
import './entity-toolbar.css';

export interface EntityToolbarProps {
  readonly identity?: ReactNode;
  readonly actions?: ReactNode;
}

export function EntityToolbar({ identity, actions }: EntityToolbarProps): ReactElement | null {
  // Slot-collapse contract: the toolbar disappears entirely when every slot is
  // empty so an empty entity header leaves no residual chrome.
  if (identity == null && actions == null) {
    return null;
  }

  return (
    <div className="ui-entity-toolbar">
      {identity != null ? <div className="ui-entity-toolbar__identity">{identity}</div> : null}
      {actions != null ? <div className="ui-entity-toolbar__actions">{actions}</div> : null}
    </div>
  );
}
