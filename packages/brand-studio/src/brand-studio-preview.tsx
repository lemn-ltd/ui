import {
	type CompiledBrandingArtifact,
	compileBrandingDefinition,
	getCompiledMode,
} from "@lemn-ltd/brand-contract";
import { Alert, AreaChart, Badge, Button, Card, Checkbox } from "@lemn-ltd/ui";
import { type ReactElement, useEffect, useId, useState } from "react";
import type { BrandStudioPreviewProps } from "./types.js";

const PREVIEW_DATA = [
	{ month: "Jan", bookings: 38, completed: 31 },
	{ month: "Feb", bookings: 52, completed: 44 },
	{ month: "Mar", bookings: 48, completed: 43 },
	{ month: "Apr", bookings: 66, completed: 59 },
	{ month: "May", bookings: 72, completed: 64 },
] as const;

/**
 * The persistence-free live preview used by Brand Studio. Hosts may render it
 * in a separate layout surface (for example a DockPanel) without reimplementing
 * the package's compiled preview or importing private UI internals.
 */
export function BrandStudioPreview({
	value,
	modeId,
	className,
}: BrandStudioPreviewProps): ReactElement {
	const resolvedModeId = value.modes[modeId ?? value.defaultModeId]
		? (modeId ?? value.defaultModeId)
		: value.defaultModeId;
	const [artifact, setArtifact] = useState<CompiledBrandingArtifact>();
	const [compiling, setCompiling] = useState(true);

	useEffect(() => {
		let active = true;
		setCompiling(true);
		void compileBrandingDefinition(value).then((result) => {
			if (!active) return;
			setArtifact(result.ok ? result.artifact : undefined);
			setCompiling(false);
		});
		return () => {
			active = false;
		};
	}, [value]);

	return (
		<>
			{artifact ? (
				<style data-lemn-brand-critical="true">{artifact.fullCss}</style>
			) : null}
			<CompiledBrandStudioPreview
				artifact={artifact}
				className={className}
				compiling={compiling}
				modeId={resolvedModeId}
			/>
		</>
	);
}

type CompiledBrandStudioPreviewProps = {
	readonly artifact?: CompiledBrandingArtifact;
	readonly modeId: string;
	readonly compiling?: boolean;
	readonly className?: string;
};

/** @internal Shared renderer used by BrandStudio and BrandStudioPreview. */
export function CompiledBrandStudioPreview({
	artifact,
	modeId,
	compiling = false,
	className,
}: CompiledBrandStudioPreviewProps): ReactElement {
	const reminderId = useId();
	const compiledMode = artifact
		? safeCompiledMode(artifact, modeId)
		: undefined;

	return (
		<section
			aria-busy={compiling || undefined}
			aria-label="Live branding preview"
			className={[
				"lemn-brand-studio-preview",
				"lemn-brand-studio__preview",
				className,
			]
				.filter(Boolean)
				.join(" ")}
		>
			<div className="lemn-brand-studio__preview-sticky">
				<p className="lemn-brand-studio__eyebrow">Live compiled preview</p>
				{compiledMode ? (
					<div
						className="lemn-brand-studio__preview-scope"
						{...compiledMode.attributes}
					>
						<Card
							elevated
							title={
								<>
									<span>Appointment overview</span>{" "}
									<Badge tone="success">Live</Badge>
								</>
							}
						>
							<fieldset
								aria-label="Typography specimen"
								className="lemn-brand-studio__type-specimen"
							>
								<span>Heading specimen</span>
								<h2>Care that feels unmistakably yours.</h2>
								<p>
									Body text stays readable across product surfaces and complete
									visual modes.
								</p>
								<code>appointment.status = &quot;confirmed&quot;</code>
							</fieldset>
							<div className="lemn-brand-studio__preview-actions">
								<Button>Book appointment</Button>
								<Button variant="secondary">View schedule</Button>
							</div>
							<div className="lemn-brand-studio__check">
								<Checkbox defaultChecked id={reminderId} />
								<label htmlFor={reminderId}>Send appointment reminder</label>
							</div>
							<AreaChart
								aria-label="Bookings and completed visits"
								animation="none"
								data={PREVIEW_DATA}
								height={220}
								index="month"
								series={[
									{
										dataKey: "bookings",
										name: "Bookings",
										color: "var(--lemn-chart-series-1)",
									},
									{
										dataKey: "completed",
										name: "Completed",
										color: "var(--lemn-chart-series-2)",
									},
								]}
							/>
						</Card>
					</div>
				) : (
					<Alert
						variant={compiling ? "info" : "error"}
						title={compiling ? "Compiling preview" : "Preview unavailable"}
						message={
							compiling
								? "Applying the current BrandingDefinition."
								: "Resolve blocking diagnostics to compile this mode."
						}
					/>
				)}
			</div>
		</section>
	);
}

function safeCompiledMode(artifact: CompiledBrandingArtifact, modeId: string) {
	try {
		return getCompiledMode(artifact, modeId);
	} catch {
		return undefined;
	}
}
