import type { ReactElement, ReactNode } from "react";

export interface ControlsProps {
	readonly children: ReactNode;
	readonly title?: string;
}

export function Controls({
	children,
	title = "Controls",
}: ControlsProps): ReactElement {
	return (
		<div className="portal-controls">
			<div className="portal-controls__title">{title}</div>
			<div className="portal-controls__body">{children}</div>
		</div>
	);
}

export interface ControlRowProps {
	readonly label: string;
	readonly children: ReactNode;
}

export function ControlRow({ label, children }: ControlRowProps): ReactElement {
	return (
		<div className="portal-controls__row">
			<span className="portal-controls__label">{label}</span>
			<span className="portal-controls__control">{children}</span>
		</div>
	);
}
