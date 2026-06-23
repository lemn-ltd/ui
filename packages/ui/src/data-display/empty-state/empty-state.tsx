import type { ReactElement, ReactNode } from 'react';
import { Button, Icon, type IconName } from '../../primitives/index.js';
import './empty-state.css';

export type EmptyStateIntent = 'first-run' | 'no-results';

export interface EmptyStateProps {
  readonly intent?: EmptyStateIntent;
  readonly icon?: IconName;
  readonly title?: ReactNode;
  readonly description?: ReactNode;
  readonly action?: ReactNode;
  readonly onClearFilters?: () => void;
  readonly className?: string;
}

const NO_RESULTS_TITLE = 'No results';
const NO_RESULTS_DESCRIPTION = 'Try adjusting your search or filters';
const NO_RESULTS_ACTION_LABEL = 'Clear filters';

/**
 * Centered empty placeholder. `first-run` invites a first action; `no-results` is the
 * shared filtered-empty surface consumed by both the command palette and the data table.
 * It is a chrome-less content block: it fills its container and centers its content, while
 * the container owns the empty region's height and any card border/radius/background.
 * The action is opt-in — pass `action`, or `onClearFilters` for the default Clear filters
 * button; with neither, no action renders.
 */
export function EmptyState({
  intent = 'first-run',
  icon,
  title,
  description,
  action,
  onClearFilters,
  className,
}: EmptyStateProps): ReactElement {
  const noResults = intent === 'no-results';
  const resolvedIcon: IconName = icon ?? (noResults ? 'search' : 'plus');
  const resolvedTitle = title ?? (noResults ? NO_RESULTS_TITLE : null);
  const resolvedDescription = description ?? (noResults ? NO_RESULTS_DESCRIPTION : null);
  const resolvedAction =
    action !== undefined ? (
      action
    ) : onClearFilters ? (
      <Button onClick={onClearFilters} variant="secondary">
        {NO_RESULTS_ACTION_LABEL}
      </Button>
    ) : null;

  return (
    <div className={['ui-empty-state', className].filter(Boolean).join(' ')} data-intent={intent}>
      <span className="ui-empty-state__icon">
        <Icon name={resolvedIcon} size={20} />
      </span>
      {resolvedTitle ? <p className="ui-empty-state__title">{resolvedTitle}</p> : null}
      {resolvedDescription ? (
        <p className="ui-empty-state__description">{resolvedDescription}</p>
      ) : null}
      {resolvedAction ? <div className="ui-empty-state__action">{resolvedAction}</div> : null}
    </div>
  );
}
