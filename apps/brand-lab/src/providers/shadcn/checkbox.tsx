import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { CheckIcon } from "lucide-react";
import type { ComponentProps } from "react";

export type BrandCheckboxProps = ComponentProps<typeof CheckboxPrimitive.Root>;

/**
 * Source-derived from the pinned shadcn/ui Checkbox snapshot recorded in the
 * provider manifest. Only the package import and styling hooks are adapted;
 * Radix owns the native checkbox state and interaction behavior.
 */
export function BrandCheckbox({ className, ...props }: BrandCheckboxProps) {
	return (
		<CheckboxPrimitive.Root
			data-slot="checkbox"
			className={["brand-lab-checkbox", className].filter(Boolean).join(" ")}
			{...props}
		>
			<CheckboxPrimitive.Indicator
				data-slot="checkbox-indicator"
				className="brand-lab-checkbox__indicator"
			>
				<CheckIcon className="brand-lab-checkbox__icon" />
			</CheckboxPrimitive.Indicator>
		</CheckboxPrimitive.Root>
	);
}
