import type { ReactElement } from "react";
import { Icon, IconButton } from "../../primitives/index.js";

export type ThemeMode = "light" | "dark";

export interface ThemeToggleProps {
	/** Concrete mode selected by the host's verified branding runtime. */
	readonly mode: ThemeMode;
	/** Requests a mode change; the component never owns or persists theme state. */
	readonly onModeChange: (mode: ThemeMode) => void;
}

/**
 * Controlled icon-only mode switch for a host-owned branding runtime.
 */
export function ThemeToggle({
	mode,
	onModeChange,
}: ThemeToggleProps): ReactElement {
	const dark = mode === "dark";
	return (
		<IconButton
			aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
			onClick={() => onModeChange(dark ? "light" : "dark")}
			variant="ghost"
		>
			<Icon name={dark ? "moon" : "sun"} size={18} />
		</IconButton>
	);
}
