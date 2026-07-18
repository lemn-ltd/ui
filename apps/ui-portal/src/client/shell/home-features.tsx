import {
	ActiveFiltersRow,
	Badge,
	Button,
	Calendar,
	Checkbox,
	DataTable,
	type DataTableColumn,
	DescriptionList,
	DescriptionRow,
	Dialog,
	Icon,
	IconButton,
	InfoBanner,
	Input,
	InputSearch,
	InputSelect,
	Menu,
	MenuItem,
	MenuLabel,
	MenuSeparator,
	Popover,
	ProgressBar,
	SegmentedControl,
	Sparkline,
	StatCard,
	StatsStrip,
	type StatCardProps,
	Toast,
	Tooltip,
} from "@lemn-ltd/ui";
import { type ComponentType, type ReactElement, useState } from "react";
import { CATALOG_REGISTRY } from "../registry/catalog-registry.js";
import type { CatalogEntry } from "../registry/catalog-types.js";

export type HomeFeatureLayout = "full" | "wide" | "tall" | "standard";

export interface HomeFeature {
	readonly id: string;
	readonly title: string;
	readonly description: string;
	readonly layout: HomeFeatureLayout;
	readonly componentSlugs: readonly [string, ...string[]];
	readonly render: ComponentType;
}

interface ReportRow {
	readonly id: string;
	readonly report: string;
	readonly status: "Ready" | "Review" | "Draft";
	readonly views: number;
}

const REPORT_STATS: readonly StatCardProps[] = [
	{
		label: "Reports viewed",
		value: "18.4k",
		delta: { direction: "up", label: "+12.8%" },
	},
	{
		label: "Active readers",
		value: "2,731",
		delta: { direction: "up", label: "+6.4%" },
	},
	{
		label: "Needs review",
		value: "14",
		delta: { direction: "down", label: "-18.2%" },
	},
];

const REPORT_ROWS: readonly ReportRow[] = [
	{ id: "report-01", report: "Revenue pulse", status: "Ready", views: 4821 },
	{
		id: "report-02",
		report: "Operations health",
		status: "Review",
		views: 3197,
	},
	{
		id: "report-03",
		report: "Retention cohorts",
		status: "Ready",
		views: 2784,
	},
	{ id: "report-04", report: "Forecast notes", status: "Draft", views: 1430 },
];

const REPORT_COLUMNS: readonly DataTableColumn<ReportRow>[] = [
	{
		key: "report",
		header: "Report",
		sortable: true,
		render: (row) => row.report,
		sortValue: (row) => row.report,
	},
	{
		key: "status",
		header: "Status",
		sortable: true,
		render: (row) => (
			<Badge
				tone={
					row.status === "Ready"
						? "success"
						: row.status === "Review"
							? "warn"
							: "neutral"
				}
				variant="soft"
			>
				{row.status}
			</Badge>
		),
		sortValue: (row) => row.status,
	},
	{
		align: "end",
		key: "views",
		header: "Views",
		sortable: true,
		render: (row) => row.views.toLocaleString("en-US"),
		sortValue: (row) => row.views,
	},
];

const FILTER_OPTIONS = [
	{ value: "all", label: "All statuses" },
	{ value: "running", label: "Running" },
	{ value: "review", label: "Needs review" },
] as const;

function ReportingFeature(): ReactElement {
	return (
		<div className="portal-home-reporting">
			<StatsStrip stats={REPORT_STATS} />
			<div className="portal-home-reporting__detail">
				<div className="portal-home-reporting__trend">
					<StatCard
						delta={{ direction: "up", label: "+9.6% this week" }}
						label="Engaged sessions"
						value="74.2%"
					/>
					<Sparkline
						aria-label="Engaged sessions trend"
						points={[28, 36, 33, 48, 52, 47, 61, 68, 65, 76, 81, 88]}
					/>
				</div>
				<DataTable
					bulkActions={(keys) => (
						<Badge tone="info" variant="soft">
							{keys.length} selected
						</Badge>
					)}
					columns={REPORT_COLUMNS}
					density="compact"
					pageSize={4}
					rowKey={(row) => row.id}
					rows={REPORT_ROWS}
					selectable
				/>
			</div>
		</div>
	);
}

function FiltersFeature(): ReactElement {
	const [query, setQuery] = useState("quarterly");
	const [owner, setOwner] = useState("Operations");
	const [status, setStatus] = useState("all");
	const [includeArchived, setIncludeArchived] = useState(false);
	const [selectedDate, setSelectedDate] = useState<Date | null>(
		new Date(2026, 6, 14),
	);
	const [chips, setChips] = useState(["Updated: This month", "Owner: My team"]);

	return (
		<div className="portal-home-filters">
			<div className="portal-home-filters__controls">
				<InputSearch
					aria-label="Search reports"
					onChange={setQuery}
					placeholder="Search reports"
					value={query}
				/>
				<div className="portal-home-filters__field">
					<label htmlFor="home-owner-filter">Owner</label>
					<Input
						id="home-owner-filter"
						onChange={(event) => setOwner(event.currentTarget.value)}
						value={owner}
					/>
				</div>
				<div className="portal-home-filters__field">
					<label htmlFor="home-status-filter">Status</label>
					<InputSelect
						aria-label="Filter by status"
						id="home-status-filter"
						onValueChange={setStatus}
						options={FILTER_OPTIONS}
						value={status}
					/>
				</div>
				<div className="portal-home-filters__check">
					<Checkbox
						checked={includeArchived}
						id="home-include-archived"
						onCheckedChange={(next) => setIncludeArchived(next === true)}
					/>
					<label htmlFor="home-include-archived">
						Include archived reports
					</label>
				</div>
				<ActiveFiltersRow
					filters={chips.map((label) => ({
						label,
						onRemove: () =>
							setChips((current) => current.filter((item) => item !== label)),
					}))}
					onClearAll={() => setChips([])}
				/>
				<p aria-live="polite" className="portal-home-filters__result">
					{includeArchived ? "42" : "36"} results for {owner || "all owners"}
					{selectedDate
						? ` through ${selectedDate.toLocaleDateString("en-US")}`
						: ""}
					.
				</p>
			</div>
			<Calendar
				onChange={setSelectedDate}
				today={new Date(2026, 6, 14)}
				value={selectedDate}
			/>
		</div>
	);
}

function DataDisplayFeature(): ReactElement {
	const [view, setView] = useState("overview");
	const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">(
		"idle",
	);
	const copied = copyState === "copied";

	const copyEndpoint = async (): Promise<void> => {
		try {
			await navigator.clipboard.writeText("reports.read");
			setCopyState("copied");
		} catch {
			setCopyState("failed");
		}
	};

	return (
		<div className="portal-home-data">
			<SegmentedControl
				aria-label="Data detail view"
				onValueChange={(value) => setView(value)}
				segments={[
					{ value: "overview", label: "Overview" },
					{ value: "runtime", label: "Runtime" },
				]}
				value={view}
			/>
			<DescriptionList>
				<DescriptionRow label="State">
					<Badge tone={view === "overview" ? "success" : "info"} variant="soft">
						{view === "overview" ? "Healthy" : "Connected"}
					</Badge>
				</DescriptionRow>
				<DescriptionRow label={view === "overview" ? "Readers" : "Region"}>
					{view === "overview" ? "2,731 active" : "Europe West"}
				</DescriptionRow>
				<DescriptionRow label="Endpoint">
					<span>reports.read</span>
					<IconButton
						aria-label={copied ? "Endpoint copied" : "Copy endpoint"}
						onClick={() => void copyEndpoint()}
						variant="ghost"
					>
						<Icon name={copied ? "check" : "copy"} size={14} />
					</IconButton>
				</DescriptionRow>
			</DescriptionList>
			<span aria-live="polite" className="portal-home-data__note">
				{copyState === "failed"
					? "Copy failed. Select the endpoint and try again."
					: copied
						? "Endpoint copied to the working set."
						: "Inspect and reuse structured values."}
			</span>
		</div>
	);
}

function FeedbackFeature(): ReactElement {
	const [progress, setProgress] = useState(32);
	const [showToast, setShowToast] = useState(true);
	const complete = progress >= 100;

	const runSync = (): void => {
		setProgress((current) => Math.min(100, current + 34));
		setShowToast(true);
	};

	return (
		<div className="portal-home-feedback">
			<InfoBanner density="compact" variant={complete ? "success" : "info"}>
				{complete
					? "All report sources are synchronized."
					: "A deterministic sync is in progress."}
			</InfoBanner>
			<ProgressBar showLabel value={progress} variant="determinate" />
			{showToast ? (
				<Toast
					detail={
						complete
							? "The catalog is ready to review."
							: "You can keep working while it runs."
					}
					onDismiss={() => setShowToast(false)}
					title={complete ? "Sync complete" : "Sync scheduled"}
					tone={complete ? "success" : "info"}
				/>
			) : null}
			<div className="portal-home-feedback__actions">
				<Button onClick={runSync} variant="secondary">
					Run sync
				</Button>
				<Button
					onClick={() => {
						setProgress(0);
						setShowToast(false);
					}}
					variant="ghost"
				>
					Reset
				</Button>
			</div>
		</div>
	);
}

function OverlaysFeature(): ReactElement {
	const [selection, setSelection] = useState("No action selected");
	const [dialogOpen, setDialogOpen] = useState(false);

	return (
		<div className="portal-home-overlays">
			<div className="portal-home-overlays__actions">
				<Popover
					arrow
					placement="bottom"
					trigger={<Button variant="secondary">Open popover</Button>}
				>
					<p>Anchored context without leaving the overview.</p>
				</Popover>
				<Menu
					align="end"
					trigger={<Button variant="secondary">Open menu</Button>}
				>
					<MenuLabel>Report actions</MenuLabel>
					<MenuItem
						icon="copy"
						onSelect={() => setSelection("Report duplicated")}
					>
						Duplicate
					</MenuItem>
					<MenuItem
						icon="folder"
						onSelect={() => setSelection("Report archived")}
					>
						Archive
					</MenuItem>
					<MenuSeparator />
					<MenuItem
						icon="trash-2"
						onSelect={() => setSelection("Delete requested")}
						tone="danger"
					>
						Delete
					</MenuItem>
				</Menu>
				<Tooltip content="Keyboard focus reveals this label" placement="top">
					<IconButton aria-label="Overlay guidance" variant="ghost">
						<Icon name="info" size={16} />
					</IconButton>
				</Tooltip>
			</div>
			<Dialog
				description="This modal uses the same focus trap and Escape behavior as every product surface."
				footer={
					<Button
						onClick={() => {
							setDialogOpen(false);
							setSelection("Access confirmed");
						}}
						variant="primary"
					>
						Confirm
					</Button>
				}
				onOpenChange={setDialogOpen}
				open={dialogOpen}
				title="Review report access"
				trigger={<Button variant="primary">Open dialog</Button>}
			>
				<p>Three workspace roles can currently view this report.</p>
			</Dialog>
			<p aria-live="polite" className="portal-home-overlays__result">
				{selection}
			</p>
		</div>
	);
}

export const HOME_FEATURES: readonly HomeFeature[] = [
	{
		id: "reporting",
		title: "Reporting that stays actionable",
		description:
			"Headline metrics, a focused trend, and a sortable, selectable table share one responsive surface.",
		layout: "full",
		componentSlugs: ["stats-strip", "stat-card", "sparkline", "data-table"],
		render: ReportingFeature,
	},
	{
		id: "filters",
		title: "Filters built for real exploration",
		description:
			"Search, structured fields, selection, dates, and removable chips keep dense report catalogs understandable.",
		layout: "wide",
		componentSlugs: [
			"input",
			"search",
			"select",
			"checkbox",
			"calendar",
			"filter-chip",
		],
		render: FiltersFeature,
	},
	{
		id: "data-display",
		title: "Inspectable data, compactly expressed",
		description:
			"Switch context, inspect structured attributes, and act on values without turning the whole surface into a link.",
		layout: "standard",
		componentSlugs: ["description-list", "badge", "segmented-control"],
		render: DataDisplayFeature,
	},
	{
		id: "feedback",
		title: "Feedback for every stage of work",
		description:
			"Banners, progress, and dismissible status messages provide clear, recoverable state as work advances.",
		layout: "standard",
		componentSlugs: ["info-banner", "progress-bar", "toast"],
		render: FeedbackFeature,
	},
	{
		id: "overlays",
		title: "Layered interactions that stay in context",
		description:
			"Menus, popovers, tooltips, and dialogs share predictable focus, dismissal, and keyboard behavior.",
		layout: "standard",
		componentSlugs: ["popover", "tooltip", "menu", "dialog"],
		render: OverlaysFeature,
	},
];

export function findMissingHomeFeatureSlugs(
	features: readonly Pick<
		HomeFeature,
		"id" | "componentSlugs"
	>[] = HOME_FEATURES,
	registry: readonly Pick<CatalogEntry, "slug">[] = CATALOG_REGISTRY,
): string[] {
	const knownSlugs = new Set(registry.map((entry) => entry.slug));
	return features.flatMap((feature) =>
		feature.componentSlugs
			.filter((slug) => !knownSlugs.has(slug))
			.map((slug) => `${feature.id}:${slug}`),
	);
}

const missingHomeFeatureSlugs = findMissingHomeFeatureSlugs();
if (missingHomeFeatureSlugs.length > 0) {
	throw new Error(
		`Unknown HOME_FEATURES component slugs: ${missingHomeFeatureSlugs.join(", ")}`,
	);
}
