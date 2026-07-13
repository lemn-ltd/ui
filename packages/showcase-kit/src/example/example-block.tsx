import { SyntaxCodeBlock, Tabs } from "@appranks/ui";
import { type ReactElement, useState } from "react";
import {
	ShowcasePreviewCanvas,
	useShowcaseRenderMode,
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
	const mode = useShowcaseRenderMode();
	const [view, setView] = useState<ExampleView>(defaultView);

	if (mode !== "page") {
		return <ShowcasePreviewCanvas>{render()}</ShowcasePreviewCanvas>;
	}

	return (
		<div className="showcase-example" data-presentation={presentation}>
			<div className="showcase-example__toolbar">
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
				<div className="showcase-example__preview">{render()}</div>
			) : presentation === "documentation" ? (
				<SyntaxCodeBlock
					className="showcase-example__syntax"
					language={language}
					value={code}
				/>
			) : (
				<pre className="showcase-example__code">
					<code>{code}</code>
				</pre>
			)}
		</div>
	);
}
