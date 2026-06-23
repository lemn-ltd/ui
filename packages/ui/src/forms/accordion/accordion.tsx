import { Accordion as RadixAccordion } from 'radix-ui';
import type { ReactElement, ReactNode } from 'react';
import { Icon } from '../../primitives/index.js';
import './accordion.css';

export interface AccordionItemData {
  readonly value: string;
  readonly label: ReactNode;
  readonly caption?: ReactNode;
  readonly content: ReactNode;
  readonly disabled?: boolean;
}

interface AccordionCommonProps {
  readonly items: readonly AccordionItemData[];

  readonly disabled?: boolean;
  readonly className?: string;
}

export interface AccordionSingleProps extends AccordionCommonProps {
  readonly type?: 'single';
  readonly value?: string;
  readonly defaultValue?: string;
  readonly collapsible?: boolean;
  readonly onValueChange?: (value: string) => void;
}

export interface AccordionMultipleProps extends AccordionCommonProps {
  readonly type: 'multiple';
  readonly value?: readonly string[];
  readonly defaultValue?: readonly string[];
  readonly onValueChange?: (value: string[]) => void;
}

export type AccordionProps = AccordionSingleProps | AccordionMultipleProps;

/**
 * Stacked disclosure rows. `single` keeps at most one section open; `multiple`
 * allows many. The header chevron rotates and the body height animates via the
 * Radix `--radix-accordion-content-height` hook on `[data-state="open"]`.
 */
export function Accordion(props: AccordionProps): ReactElement {
  const { items, disabled, className } = props;
  const rootClassName = ['ui-accordion', className].filter(Boolean).join(' ');

  const rows = items.map((item) => (
    <RadixAccordion.Item
      className="ui-accordion__item"
      disabled={item.disabled}
      key={item.value}
      value={item.value}
    >
      <RadixAccordion.Header className="ui-accordion__header">
        <RadixAccordion.Trigger className="ui-accordion__trigger">
          <span className="ui-accordion__heading">
            <span className="ui-accordion__label">{item.label}</span>
            {item.caption ? <span className="ui-accordion__caption">{item.caption}</span> : null}
          </span>
          <Icon className="ui-accordion__chevron" name="chevron-down" size={18} />
        </RadixAccordion.Trigger>
      </RadixAccordion.Header>
      <RadixAccordion.Content className="ui-accordion__content">
        <div className="ui-accordion__body">{item.content}</div>
      </RadixAccordion.Content>
    </RadixAccordion.Item>
  ));

  if (props.type === 'multiple') {
    return (
      <RadixAccordion.Root
        className={rootClassName}
        disabled={disabled}
        onValueChange={props.onValueChange}
        type="multiple"
        value={props.value as string[] | undefined}
        defaultValue={props.defaultValue as string[] | undefined}
      >
        {rows}
      </RadixAccordion.Root>
    );
  }

  return (
    <RadixAccordion.Root
      className={rootClassName}
      collapsible={props.collapsible ?? true}
      disabled={disabled}
      onValueChange={props.onValueChange}
      type="single"
      value={props.value}
      defaultValue={props.defaultValue}
    >
      {rows}
    </RadixAccordion.Root>
  );
}
