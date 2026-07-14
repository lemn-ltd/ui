import { Tabs as RadixTabs } from 'radix-ui';
import { type ReactElement, type ReactNode, useId, useState } from 'react';
import './tabs.css';

export interface TabItem {
  readonly value: string;
  readonly label: ReactNode;
  readonly count?: number;
  readonly content?: ReactNode;
  readonly disabled?: boolean;
}

export interface TabsProps {
  readonly items: readonly TabItem[];
  readonly value?: string;
  readonly defaultValue?: string;
  readonly onValueChange?: (value: string) => void;
  readonly orientation?: 'horizontal' | 'vertical';
  readonly activationMode?: 'automatic' | 'manual';
  /** Preserve inactive panel state by default; lazy mounting must be explicit. */
  readonly mountStrategy?: 'preserve' | 'lazy';
  readonly id?: string;
  readonly 'aria-label'?: string;
  readonly className?: string;
}

export function Tabs({
  items,
  value,
  defaultValue,
  onValueChange,
  orientation = 'horizontal',
  activationMode = 'automatic',
  mountStrategy = 'preserve',
  id,
  'aria-label': ariaLabel,
  className,
}: TabsProps): ReactElement {
  const generatedId = useId();
  const baseId = id ?? generatedId;
  const isControlled = value !== undefined;
  const [activeState, setActiveState] = useState(defaultValue ?? items[0]?.value ?? '');
  const activeValue = isControlled ? value : activeState;
  const panelItems =
    mountStrategy === 'lazy' ? items.filter((item) => item.value === activeValue) : items;
  return (
    <RadixTabs.Root
      activationMode={activationMode}
      className={['ui-tabs-root', className].filter(Boolean).join(' ')}
      onValueChange={(next) => {
        if (!isControlled) setActiveState(next);
        onValueChange?.(next);
      }}
      orientation={orientation}
      value={activeValue}
    >
      <RadixTabs.List aria-label={ariaLabel} className="ui-tabs">
        {items.map((item, index) => {
          const triggerId = `${baseId}-tab-${index}`;
          const panelId = `${baseId}-panel-${index}`;
          return (
          <RadixTabs.Trigger
            aria-controls={panelId}
            className="ui-tabs__tab"
            disabled={item.disabled}
            id={triggerId}
            key={item.value}
            value={item.value}
          >
            <span className="ui-tabs__label">{item.label}</span>
            {item.count != null ? <span className="ui-tabs__count">{item.count}</span> : null}
          </RadixTabs.Trigger>
          );
        })}
      </RadixTabs.List>
      {panelItems.map((item) => {
        const index = items.findIndex((candidate) => candidate.value === item.value);
        const triggerId = `${baseId}-tab-${index}`;
        const panelId = `${baseId}-panel-${index}`;
        return (
          <RadixTabs.Content
            aria-labelledby={triggerId}
            className="ui-tabs__panel"
            forceMount={mountStrategy === 'preserve' ? true : undefined}
            hidden={item.value !== activeValue}
            id={panelId}
            key={item.value}
            value={item.value}
          >
            {item.content}
          </RadixTabs.Content>
        );
      })}
    </RadixTabs.Root>
  );
}
