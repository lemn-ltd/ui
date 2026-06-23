import { Tooltip as RadixTooltip } from 'radix-ui';
import type { ReactElement, ReactNode } from 'react';
import './tooltip.css';

export type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right';

export type TooltipTone = 'neutral' | 'info' | 'warn' | 'danger' | 'success';

export interface TooltipProps {
  readonly content: ReactNode;
  readonly children: ReactNode;
  readonly placement?: TooltipPlacement;
  readonly tone?: TooltipTone;
  readonly delayDuration?: number;
}

export function Tooltip({
  content,
  children,
  placement = 'top',
  tone = 'neutral',
  delayDuration = 200,
}: TooltipProps): ReactElement {
  return (
    <RadixTooltip.Provider delayDuration={delayDuration}>
      <RadixTooltip.Root>
        <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
        <RadixTooltip.Portal>
          <RadixTooltip.Content
            className="ui-tooltip"
            data-tone={tone}
            side={placement}
            sideOffset={6}
          >
            {content}
            <RadixTooltip.Arrow className="ui-tooltip__arrow" />
          </RadixTooltip.Content>
        </RadixTooltip.Portal>
      </RadixTooltip.Root>
    </RadixTooltip.Provider>
  );
}
