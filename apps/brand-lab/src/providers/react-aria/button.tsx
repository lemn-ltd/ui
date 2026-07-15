import { forwardRef } from "react";
import {
	Button as ReactAriaButton,
	type ButtonProps as ReactAriaButtonProps,
} from "react-aria-components/Button";

export type BrandButtonProps = ReactAriaButtonProps;

/**
 * Branding-only adapter for React Aria's Button. Native press, pending,
 * disabled, focus, slot, render-prop, and accessibility behavior is forwarded
 * without compatibility aliases.
 */
export const BrandButton = forwardRef<HTMLButtonElement, BrandButtonProps>(
	function BrandButton({ className, ...props }, ref) {
		return (
			<ReactAriaButton
				ref={ref}
				className={(renderProps) =>
					[
						"brand-lab-button",
						typeof className === "function"
							? className(renderProps)
							: className,
					]
						.filter(Boolean)
						.join(" ")
				}
				{...props}
			/>
		);
	},
);
