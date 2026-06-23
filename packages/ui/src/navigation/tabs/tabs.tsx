import { Tabs as RadixTabs } from 'radix-ui';
import type { ReactElement, ReactNode } from 'react';
import './tabs.css';

export interface TabItem {
  readonly value: string;
  readonly label: ReactNode;
  readonly count?: number;
}

export interface TabsProps {
  readonly items: readonly TabItem[];
  readonly value: string;
  readonly onValueChange: (value: string) => void;
  readonly orientation?: 'horizontal' | 'vertical';
}

export function Tabs({
  items,
  value,
  onValueChange,
  orientation = 'horizontal',
}: TabsProps): ReactElement {
  return (
    <RadixTabs.Root onValueChange={onValueChange} orientation={orientation} value={value}>
      <RadixTabs.List className="ui-tabs">
        {items.map((item) => (
          <RadixTabs.Trigger className="ui-tabs__tab" key={item.value} value={item.value}>
            <span className="ui-tabs__label">{item.label}</span>
            {item.count != null ? <span className="ui-tabs__count">{item.count}</span> : null}
          </RadixTabs.Trigger>
        ))}
      </RadixTabs.List>
      {/* This is a tab bar; consumers render the active view elsewhere. The empty
          force-mounted panels exist only so every trigger's aria-controls points
          at a real (hidden) element instead of a dangling id. */}
      {items.map((item) => (
        <RadixTabs.Content forceMount key={item.value} value={item.value} />
      ))}
    </RadixTabs.Root>
  );
}
