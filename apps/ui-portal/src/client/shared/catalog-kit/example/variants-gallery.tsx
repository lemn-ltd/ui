import type { CSSProperties, ReactElement } from "react";

export interface VariantSpec {
	readonly label: string;
	readonly render: () => ReactElement;
}

export interface VariantsGalleryProps {
	readonly items: readonly VariantSpec[];
	readonly columns?: number;
}

export function VariantsGallery({
	items,
	columns,
}: VariantsGalleryProps): ReactElement {
	const desktopColumns = columns ?? 3;
	const style = {
		"--portal-variants-columns": String(desktopColumns),
		"--portal-variants-mobile-columns": String(Math.min(desktopColumns, 2)),
	} as CSSProperties;

	return (
		<div className="portal-variants" style={style}>
			{items.map((item) => (
				<div className="portal-variants__cell" key={item.label}>
					<div className="portal-variants__preview">{item.render()}</div>
					<div className="portal-variants__label">{item.label}</div>
				</div>
			))}
		</div>
	);
}

/**
 * Build a `VariantSpec[]` from a contract enum's values so a component renders
 * once per member with no per-variant JSX. The enum array is passed in by the
 * app (the kit imports no product or contract code), so adding an enum member
 * adds a gallery cell with no page edit.
 */
export function variantsFromEnum<TValue extends string | number>(
	values: readonly TValue[],
	render: (value: TValue) => ReactElement,
): readonly VariantSpec[] {
	return values.map((value) => ({
		label: String(value),
		render: () => render(value),
	}));
}
