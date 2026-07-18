import { systemBrandingTemplates } from "@lemn-ltd/brand-contract/system-brandings";
import {
	Button,
	Card,
	Checkbox,
	ContentLayout,
	DashboardOverviewBlock,
	Input,
	SelectNative,
	ThemeToggle,
} from "@lemn-ltd/ui";
import { type ReactElement, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
	BrandPreviewCanvas,
	IsolatedBrandRuntimeProvider,
	usePortalBrand,
} from "../../branding/brand-runtime";

const DEFAULT_PRESET = "verdant-ledger";
const TREND = [
	{ month: "Jan", value: 36 },
	{ month: "Feb", value: 52 },
	{ month: "Mar", value: 47 },
	{ month: "Apr", value: 68 },
];

export function PlaygroundPage(): ReactElement {
	const {
		artifact: portalArtifact,
		definition: portalDefinition,
		setModeByColorScheme: setPortalModeByColorScheme,
	} = usePortalBrand();

	return (
		<IsolatedBrandRuntimeProvider
			initialArtifact={portalArtifact}
			initialDefinition={portalDefinition}
		>
			<PlaygroundExperience
				setPortalModeByColorScheme={setPortalModeByColorScheme}
			/>
		</IsolatedBrandRuntimeProvider>
	);
}

interface PlaygroundExperienceProps {
	readonly setPortalModeByColorScheme: (mode: "light" | "dark") => void;
}

function PlaygroundExperience({
	setPortalModeByColorScheme,
}: PlaygroundExperienceProps): ReactElement {
	const {
		compiling,
		mode,
		setModeByColorScheme,
		setSystemBrandingId,
		systemBrandingId,
	} = usePortalBrand();
	const [params, setParams] = useSearchParams();
	const [checked, setChecked] = useState(true);
	const [name, setName] = useState("Quarterly report");
	const synchronizationQueue = useRef(Promise.resolve());
	const runtime = useRef({
		setModeByColorScheme,
		setPortalModeByColorScheme,
		setSystemBrandingId,
		systemBrandingId,
	});
	runtime.current = {
		setModeByColorScheme,
		setPortalModeByColorScheme,
		setSystemBrandingId,
		systemBrandingId,
	};
	const searchState = params.toString();

	useEffect(() => {
		const requestedPreset = params.get("preset");
		const preset = systemBrandingTemplates.some(
			(entry) => entry.id === requestedPreset && entry.status === "available",
		)
			? (requestedPreset as string)
			: DEFAULT_PRESET;
		const requestedTheme = params.get("theme");
		const theme =
			requestedTheme === "dark" || requestedTheme === "light"
				? requestedTheme
				: "light";
		let cancelled = false;

		synchronizationQueue.current = synchronizationQueue.current
			.catch(() => undefined)
			.then(async () => {
				if (cancelled) return;
				if (runtime.current.systemBrandingId !== preset) {
					await runtime.current.setSystemBrandingId(preset);
				}
				if (cancelled) return;
				await new Promise<void>((resolve) => setTimeout(resolve, 0));
				if (!cancelled) {
					runtime.current.setModeByColorScheme(theme);
					runtime.current.setPortalModeByColorScheme(theme);
				}
			});

		return () => {
			cancelled = true;
		};
	}, [searchState]);

	const updatePreset = (preset: string): void => {
		setParams({ preset, theme: mode.colorScheme });
	};
	const updateTheme = (theme: "light" | "dark"): void => {
		setParams({ preset: systemBrandingId, theme });
	};
	const reset = (): void => {
		setChecked(true);
		setName("Quarterly report");
		setParams({ preset: DEFAULT_PRESET, theme: "light" });
	};

	return (
		<ContentLayout className="portal-ecosystem-page portal-playground-page">
			<header className="portal-ecosystem-page__header">
				<span>Persistence-free preview</span>
				<h1>Playground</h1>
				<p>Choose an immutable System branding and light or dark mode. The URL preserves this preview; nothing is saved or published.</p>
			</header>
			<div className="portal-playground-controls" aria-label="Playground controls">
				<SelectNative
					aria-label="System branding preset"
					disabled={compiling}
					onValueChange={updatePreset}
					options={systemBrandingTemplates
						.filter((template) => template.status === "available")
						.map((template) => ({ label: `${template.name} · v${template.version}`, value: template.id }))}
					value={systemBrandingId}
				/>
				<ThemeToggle mode={mode.colorScheme} onModeChange={updateTheme} />
				<Button onClick={reset} variant="outline">Reset</Button>
			</div>
			<BrandPreviewCanvas>
				<div className="portal-playground-canvas">
					<Card>
						<h2>Interactive form</h2>
						<Input aria-label="Report name" onChange={(event) => setName(event.currentTarget.value)} value={name} />
						<label className="portal-playground-check">
							<Checkbox checked={checked} onCheckedChange={(value) => setChecked(value === true)} />
							<span>Include comparison period</span>
						</label>
						<Button>Generate report</Button>
					</Card>
					<DashboardOverviewBlock
						description="The compiled categorical palette is shared across this provider-backed chart and every Core visualization."
						metrics={[
							{ id: "revenue", label: "Revenue", value: "$84.2k", delta: { direction: "up", label: "+8.4%" } },
							{ id: "orders", label: "Orders", value: "1,248", delta: { direction: "up", label: "+5.1%" } },
						]}
						rankingItems={[{ label: "Direct", value: 72 }, { label: "Partners", value: 48 }]}
						trendData={TREND}
						trendIndex="month"
						trendSeries={[{ dataKey: "value", name: "Revenue" }]}
					/>
				</div>
			</BrandPreviewCanvas>
		</ContentLayout>
	);
}
