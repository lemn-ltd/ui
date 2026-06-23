import { Dialog as RadixDialog } from 'radix-ui';
import { type ComponentProps, type ReactElement, type ReactNode, useEffect, useState } from 'react';
import { Icon, IconButton } from '../../primitives/index.js';
import './floating-window.css';

export type FloatingWindowWidth = 'sm' | 'md' | 'lg';

export interface FloatingWindowProps {
  readonly title: ReactNode;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;

  readonly width?: FloatingWindowWidth;
  readonly className?: string;
  readonly titleClassName?: string;
  readonly onEscapeKeyDown?: ComponentProps<typeof RadixDialog.Content>['onEscapeKeyDown'];
  readonly actions?: ReactNode;
  readonly children: ReactNode;
}

/**
 * Floating non-modal window with no scrim. The page behind remains interactive,
 * and the built-in controls provide expand/restore and close behavior.
 */
export function FloatingWindow({
  title,
  open,
  onOpenChange,
  width = 'md',
  className,
  titleClassName,
  onEscapeKeyDown,
  actions,
  children,
}: FloatingWindowProps): ReactElement {
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!open) setExpanded(false);
  }, [open]);

  return (
    <RadixDialog.Root modal={false} onOpenChange={onOpenChange} open={open}>
      <RadixDialog.Portal>
        <RadixDialog.Content
          aria-describedby={undefined}
          className={['ui-floating-window', className].filter(Boolean).join(' ')}
          data-expanded={expanded ? 'true' : 'false'}
          data-width={width}
          onEscapeKeyDown={onEscapeKeyDown}
          onInteractOutside={(event) => event.preventDefault()}
        >
          <div className="ui-floating-window__header">
            <RadixDialog.Title
              className={['ui-floating-window__title', titleClassName].filter(Boolean).join(' ')}
            >
              {title}
            </RadixDialog.Title>
            <div className="ui-floating-window__actions">
              {actions}
              <IconButton
                aria-label={expanded ? 'Restore size' : 'Expand to full screen'}
                onClick={() => setExpanded((current) => !current)}
                variant="ghost"
              >
                <Icon name={expanded ? 'minimize-2' : 'maximize-2'} size={16} />
              </IconButton>
              <RadixDialog.Close asChild>
                <IconButton aria-label="Close" variant="ghost">
                  <Icon name="x" size={16} />
                </IconButton>
              </RadixDialog.Close>
            </div>
          </div>
          {children}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
