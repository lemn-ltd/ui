import { ToggleGroup as RadixToggleGroup } from 'radix-ui';
import type { ReactElement, ReactNode } from 'react';
import './toggle-group.css';

export interface ToggleGroupItem {
  readonly value: string;
  readonly label: ReactNode;
  readonly icon?: ReactNode;
  readonly disabled?: boolean;
  readonly 'aria-label'?: string;
}

interface ToggleGroupBaseProps {
  readonly items: readonly ToggleGroupItem[];
  readonly disabled?: boolean;
  readonly orientation?: 'horizontal' | 'vertical';
  readonly loop?: boolean;
  readonly 'aria-label'?: string;
  readonly 'aria-labelledby'?: string;
  readonly className?: string;
}

export interface ToggleGroupSingleProps extends ToggleGroupBaseProps {
  readonly type: 'single';
  readonly value?: string;
  readonly defaultValue?: string;
  readonly onValueChange?: (value: string) => void;
}

export interface ToggleGroupMultipleProps extends ToggleGroupBaseProps {
  readonly type: 'multiple';
  readonly value?: readonly string[];
  readonly defaultValue?: readonly string[];
  readonly onValueChange?: (value: string[]) => void;
}

export type ToggleGroupProps = ToggleGroupSingleProps | ToggleGroupMultipleProps;

function ToggleItems({ items }: { readonly items: readonly ToggleGroupItem[] }): ReactElement {
  return (
    <>
      {items.map((item) => (
        <RadixToggleGroup.Item
          aria-label={item['aria-label']}
          className="ui-toggle-group__item"
          disabled={item.disabled}
          key={item.value}
          value={item.value}
        >
          {item.icon ? (
            <span aria-hidden="true" className="ui-toggle-group__icon">
              {item.icon}
            </span>
          ) : null}
          <span className="ui-toggle-group__label">{item.label}</span>
        </RadixToggleGroup.Item>
      ))}
    </>
  );
}

/** Single- or multi-select command group; distinct from switches and segmented views. */
export function ToggleGroup(props: ToggleGroupProps): ReactElement {
  const {
    items,
    disabled,
    orientation = 'horizontal',
    loop = true,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledby,
    className,
  } = props;
  const common = {
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledby,
    className: ['ui-toggle-group', className].filter(Boolean).join(' '),
    disabled,
    loop,
    orientation,
  } as const;

  if (props.type === 'single') {
    return (
      <RadixToggleGroup.Root
        {...common}
        defaultValue={props.defaultValue}
        onValueChange={props.onValueChange}
        type="single"
        value={props.value}
      >
        <ToggleItems items={items} />
      </RadixToggleGroup.Root>
    );
  }

  return (
    <RadixToggleGroup.Root
      {...common}
      defaultValue={props.defaultValue ? [...props.defaultValue] : undefined}
      onValueChange={props.onValueChange}
      type="multiple"
      value={props.value ? [...props.value] : undefined}
    >
      <ToggleItems items={items} />
    </RadixToggleGroup.Root>
  );
}
