// Generated from Tremor Tracker [v1.0.0]. Do not edit; run provider snapshot sync.

import React from "react"
import { HoverCard as HoverCardPrimitives } from "radix-ui"

const cx = (...values: Array<string | undefined | false>) => values.filter(Boolean).join(" ")

export interface TremorTrackerBlockProps {
  key?: string | number
  color?: string
  tooltip?: string
  hoverEffect?: boolean
  defaultBackgroundColor?: string
  accessibleLabel: string
  blockStyle?: React.CSSProperties
  customColor?: boolean
  status: string
}

const Block = ({
  color,
  tooltip,
  defaultBackgroundColor,
  hoverEffect,
  accessibleLabel,
  blockStyle,
  customColor,
  status,
}: TremorTrackerBlockProps) => {
  const [open, setOpen] = React.useState(false)
  const tooltipId = React.useId()
  return (
    <HoverCardPrimitives.Root
      open={open}
      onOpenChange={setOpen}
      openDelay={0}
      closeDelay={0}
      tremor-id="tremor-raw"
    >
      <HoverCardPrimitives.Trigger onClick={() => setOpen(true)} asChild>
        <li
          aria-describedby={tooltip && open ? tooltipId : undefined}
          className="ui-tracker-provider__item"
          data-custom-color={customColor || undefined}
          data-status={status}
          tabIndex={tooltip ? 0 : undefined}
        >
          <span
            aria-hidden="true"
            className={cx(
              "ui-tracker-provider__block",
              color || defaultBackgroundColor,
              hoverEffect ? "ui-tracker-provider__block--hover" : "",
            )}
            style={blockStyle}
          />
          <span className="ui-tracker__sr-only">{accessibleLabel}</span>
        </li>
      </HoverCardPrimitives.Trigger>
      <HoverCardPrimitives.Portal>
        <HoverCardPrimitives.Content
          id={tooltipId}
          sideOffset={10}
          side="top"
          align="center"
          avoidCollisions
          className="ui-tracker-provider__tooltip"
        >
          {tooltip}
        </HoverCardPrimitives.Content>
      </HoverCardPrimitives.Portal>
    </HoverCardPrimitives.Root>
  )
}

Block.displayName = "Block"

export interface TremorTrackerProps extends React.HTMLAttributes<HTMLOListElement> {
  data: TremorTrackerBlockProps[]
  defaultBackgroundColor?: string
  hoverEffect?: boolean
}

const TremorTracker = React.forwardRef<HTMLOListElement, TremorTrackerProps>(
  (
    {
      data = [],
      defaultBackgroundColor = "ui-tracker-provider__block--pending",
      className,
      hoverEffect,
      ...props
    },
    forwardedRef,
  ) => {
    return (
      <ol
        ref={forwardedRef}
        className={cx("ui-tracker-provider", className)}
        data-hover-effect={hoverEffect || undefined}
        {...props}
      >
        {data.map((props, index) => (
          <Block
            key={props.key ?? index}
            defaultBackgroundColor={defaultBackgroundColor}
            hoverEffect={hoverEffect}
            {...props}
          />
        ))}
      </ol>
    )
  },
)

TremorTracker.displayName = "TremorTracker"

export { TremorTracker }
