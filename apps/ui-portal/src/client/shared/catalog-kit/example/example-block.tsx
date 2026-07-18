import { SyntaxCodeBlock, Tabs } from "@lemn-ltd/ui";
import { type ReactElement, useState } from "react";
import {
	PortalPreviewCanvas,
	useCatalogRenderMode,
} from "../preview/render-mode.js";

export interface ExampleBlockProps {
	readonly render: () => ReactElement;
	readonly code: string;
	readonly defaultView?: ExampleView;
	readonly language?: string;
	readonly presentation?: "catalog" | "documentation";
}

type ExampleView = "preview" | "code";

export function ExampleBlock({
	render,
	code,
	defaultView = "preview",
	language = "tsx",
	presentation = "catalog",
}: ExampleBlockProps): ReactElement {
	const mode = useCatalogRenderMode();
	const [view, setView] = useState<ExampleView>(defaultView);

	if (mode !== "page") {
		return <PortalPreviewCanvas>{render()}</PortalPreviewCanvas>;
	}

	return (
		<div className="portal-example" data-presentation={presentation}>
			<div className="portal-example__toolbar">
				<Tabs
					items={[
						{ value: "preview", label: "Preview" },
						{ value: "code", label: "Code" },
					]}
					onValueChange={(value) => setView(value as ExampleView)}
					value={view}
				/>
			</div>
			{view === "preview" ? (
				<div className="portal-example__preview">{render()}</div>
			) : presentation === "documentation" ? (
				<SyntaxCodeBlock
					className="portal-example__syntax"
					language={language}
					value={code}
				/>
			) : (
				<pre className="portal-example__code">
					<code>{code}</code>
				</pre>
			)}
		</div>
	);
}
