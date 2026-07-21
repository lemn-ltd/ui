import {
	type CompiledBrandingArtifact,
	compileBrandingDefinition,
	getCompiledMode,
} from "@lemn-ltd/brand-contract";
import {
	Alert,
	AreaChart,
	Avatar,
	type AvatarColor,
	AvatarGroup,
	Badge,
	Button,
	Card,
	Checkbox,
	DataTable,
	type DataTableColumn,
	DonutChart,
	Field,
	Icon,
	IconButton,
	Input,
	InputSearch,
	PageHeader,
	ProgressBar,
	SegmentedControl,
	SelectNative,
	Sparkline,
	StatsStrip,
	Tabs,
	Tag,
	Textarea,
	Toggle,
} from "@lemn-ltd/ui";
import { type ReactElement, useEffect, useId, useState } from "react";
import type { BrandStudioPreviewProps } from "./types.js";

type PreviewRange = "week" | "month" | "quarter";

type ActivityDatum = {
	readonly period: string;
	readonly bookings: number;
	readonly completed: number;
};

type AppointmentStatus = "Confirmed" | "Checked in" | "Pending" | "Waitlist";

type AppointmentRow = {
	readonly id: string;
	readonly time: string;
	readonly patient: string;
	readonly initials: string;
	readonly avatarColor: AvatarColor;
	readonly service: string;
	readonly clinician: string;
	readonly status: AppointmentStatus;
};

const CHART_DATA: Readonly<Record<PreviewRange, readonly ActivityDatum[]>> = {
	week: [
		{ period: "Mon", bookings: 18, completed: 14 },
		{ period: "Tue", bookings: 24, completed: 21 },
		{ period: "Wed", bookings: 20, completed: 18 },
		{ period: "Thu", bookings: 29, completed: 24 },
		{ period: "Fri", bookings: 32, completed: 27 },
		{ period: "Sat", bookings: 22, completed: 19 },
		{ period: "Sun", bookings: 16, completed: 14 },
	],
	month: [
		{ period: "Week 1", bookings: 82, completed: 69 },
		{ period: "Week 2", bookings: 96, completed: 84 },
		{ period: "Week 3", bookings: 91, completed: 80 },
		{ period: "Week 4", bookings: 108, completed: 96 },
	],
	quarter: [
		{ period: "May", bookings: 338, completed: 294 },
		{ period: "Jun", bookings: 372, completed: 331 },
		{ period: "Jul", bookings: 401, completed: 358 },
	],
};

const APPOINTMENTS: readonly AppointmentRow[] = [
	{
		id: "appointment-1",
		time: "09:00",
		patient: "Amelia Hart",
		initials: "AH",
		avatarColor: "teal",
		service: "Wellness review",
		clinician: "Dr. Maya Chen",
		status: "Checked in",
	},
	{
		id: "appointment-2",
		time: "10:30",
		patient: "Noah Williams",
		initials: "NW",
		avatarColor: "teal",
		service: "Follow-up visit",
		clinician: "Dr. Elias Moore",
		status: "Confirmed",
	},
	{
		id: "appointment-3",
		time: "12:15",
		patient: "Sofia Patel",
		initials: "SP",
		avatarColor: "teal",
		service: "Initial consultation",
		clinician: "Dr. Maya Chen",
		status: "Pending",
	},
	{
		id: "appointment-4",
		time: "14:00",
		patient: "Leo Martin",
		initials: "LM",
		avatarColor: "teal",
		service: "Therapy session",
		clinician: "Dr. Hana Lee",
		status: "Waitlist",
	},
] as const;

const STATUS_TONES = {
	Confirmed: "success",
	"Checked in": "accent",
	Pending: "warn",
	Waitlist: "info",
} as const;

const APPOINTMENT_COLUMNS: readonly DataTableColumn<AppointmentRow>[] = [
	{
		key: "time",
		header: "Time",
		sortable: true,
		sortValue: (row) => row.time,
		width: 82,
		render: (row) => <strong>{row.time}</strong>,
	},
	{
		key: "patient",
		header: "Patient",
		sortable: true,
		sortValue: (row) => row.patient,
		minWidth: 190,
		render: (row) => (
			<span className="lemn-brand-preview__patient">
				<Avatar color={row.avatarColor} size={32}>
					{row.initials}
				</Avatar>
				<span>
					<strong>{row.patient}</strong>
					<small>{row.service}</small>
				</span>
			</span>
		),
	},
	{
		key: "clinician",
		header: "Clinician",
		hideable: true,
		minWidth: 150,
		render: (row) => row.clinician,
	},
	{
		key: "status",
		header: "Status",
		minWidth: 110,
		render: (row) => (
			<Badge size="sm" tone={STATUS_TONES[row.status]}>
				{row.status}
			</Badge>
		),
	},
];

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
				placement="external"
			/>
		</>
	);
}

type CompiledBrandStudioPreviewProps = {
	readonly artifact?: CompiledBrandingArtifact;
	readonly modeId: string;
	readonly compiling?: boolean;
	readonly className?: string;
	readonly placement?: "inline" | "external";
};

/** @internal Shared renderer used by BrandStudio and BrandStudioPreview. */
export function CompiledBrandStudioPreview({
	artifact,
	modeId,
	compiling = false,
	className,
	placement = "inline",
}: CompiledBrandStudioPreviewProps): ReactElement {
	const reminderId = useId();
	const [range, setRange] = useState<PreviewRange>("week");
	const [searchQuery, setSearchQuery] = useState("");
	const [remindersEnabled, setRemindersEnabled] = useState(true);
	const [bookingSaved, setBookingSaved] = useState(false);
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
				`lemn-brand-studio__preview--${placement}`,
				className,
			]
				.filter(Boolean)
				.join(" ")}
		>
			<div className="lemn-brand-studio__preview-sticky">
				{compiledMode ? (
					<div
						className="lemn-brand-studio__preview-scope"
						{...compiledMode.attributes}
					>
						<div className="lemn-brand-preview__app">
							<aside
								aria-label="Clinic navigation"
								className="lemn-brand-preview__sidebar"
							>
								<div className="lemn-brand-preview__brand">
									<span
										aria-hidden="true"
										className="lemn-brand-preview__brand-mark"
									>
										N
									</span>
									<span>
										<strong>Northstar</strong>
										<small>Health studio</small>
									</span>
								</div>
								<nav
									aria-label="Preview sections"
									className="lemn-brand-preview__nav"
								>
									<button aria-current="page" type="button">
										<Icon name="layout-grid" size={16} />
										Overview
									</button>
									<button type="button">
										<Icon name="clock" size={16} />
										Schedule
									</button>
									<button type="button">
										<Icon name="users" size={16} />
										Patients
									</button>
									<button type="button">
										<Icon name="list" size={16} />
										Reports
									</button>
								</nav>
								<div className="lemn-brand-preview__sidebar-note">
									<Icon name="check-circle" size={16} />
									<span>
										<strong>All systems ready</strong>
										<small>Last sync 2 min ago</small>
									</span>
								</div>
							</aside>

							<div className="lemn-brand-preview__workspace">
								<header className="lemn-brand-preview__topbar">
									<div className="lemn-brand-preview__mobile-brand">
										<span
											aria-hidden="true"
											className="lemn-brand-preview__brand-mark"
										>
											N
										</span>
										<strong>Northstar</strong>
									</div>
									<div className="lemn-brand-preview__topbar-actions">
										<InputSearch
											aria-label="Search patients"
											onChange={setSearchQuery}
											placeholder="Search patients"
											value={searchQuery}
										/>
										<Badge showDot tone="success" variant="soft">
											Open
										</Badge>
										<IconButton aria-label="Open settings" variant="ghost">
											<Icon name="settings" size={18} />
										</IconButton>
										<Avatar color="teal" size={32} status="online">
											MC
										</Avatar>
									</div>
								</header>

								<main className="lemn-brand-preview__content">
									<PageHeader
										actions={
											<Button startIcon={<Icon name="plus" size={16} />}>
												New appointment
											</Button>
										}
										subtitle="Monday, July 21 · Your team has 18 visits scheduled today."
										title="Good morning, Maya"
										titleAccessory={<Badge tone="accent">Today</Badge>}
									/>

									<Alert
										message="Every room is staffed and the next patient has completed check-in."
										title="The schedule is on track"
										variant="success"
									/>

									<StatsStrip
										aria-label="Today at a glance"
										stats={[
											{
												label: "Appointments",
												value: "18",
												delta: { direction: "up", label: "+12%" },
											},
											{
												label: "Checked in",
												value: "11",
												delta: { direction: "up", label: "61%" },
											},
											{
												label: "Open slots",
												value: "3",
												delta: { direction: "flat", label: "Today" },
											},
											{
												label: "Satisfaction",
												value: "4.9",
												delta: { direction: "up", label: "+0.2" },
											},
										]}
									/>

									<div className="lemn-brand-preview__analytics-grid">
										<Card
											className="lemn-brand-preview__chart-card"
											title={
												<div className="lemn-brand-preview__card-heading">
													<span>
														<strong>Visit activity</strong>
														<small>
															Bookings compared with completed visits
														</small>
													</span>
													<SegmentedControl
														aria-label="Chart range"
														onValueChange={(value) =>
															setRange(value as PreviewRange)
														}
														segments={[
															{ value: "week", label: "7 days" },
															{ value: "month", label: "Month" },
															{ value: "quarter", label: "Quarter" },
														]}
														value={range}
													/>
												</div>
											}
										>
											<AreaChart
												aria-label="Bookings and completed visits"
												animation="none"
												data={CHART_DATA[range]}
												height={260}
												index="period"
												legendPosition="left"
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

										<Card
											className="lemn-brand-preview__capacity-card"
											title="Capacity today"
										>
											<DonutChart
												aria-label="Appointments by service"
												animation="none"
												centerLabel="18 visits"
												data={[
													{
														label: "Consultations",
														value: 8,
														color: "var(--lemn-chart-series-1)",
													},
													{
														label: "Follow-ups",
														value: 6,
														color: "var(--lemn-chart-series-2)",
													},
													{
														label: "Therapy",
														value: 4,
														color: "var(--lemn-chart-series-3)",
													},
												]}
												height={190}
												showLegend={false}
											/>
											<div className="lemn-brand-preview__capacity-details">
												<div>
													<span>
														<span>Rooms occupied</span>
														<strong>6 of 8</strong>
													</span>
													<ProgressBar aria-label="Rooms occupied" value={75} />
												</div>
												<div className="lemn-brand-preview__team-row">
													<AvatarGroup max={3}>
														<Avatar color="teal" size={24}>
															MC
														</Avatar>
														<Avatar color="teal" size={24}>
															EM
														</Avatar>
														<Avatar color="teal" size={24}>
															HL
														</Avatar>
														<Avatar color="teal" size={24}>
															+2
														</Avatar>
													</AvatarGroup>
													<Tag variant="accent">5 clinicians</Tag>
												</div>
											</div>
										</Card>
									</div>

									<div className="lemn-brand-preview__operations-grid">
										<Card className="lemn-brand-preview__schedule-card">
											<Tabs
												aria-label="Appointment queues"
												items={[
													{
														value: "schedule",
														label: "Today's schedule",
														count: 18,
														content: (
															<DataTable
																bulkActions={(keys) => (
																	<Button size="sm" variant="secondary">
																		Message {keys.length}
																	</Button>
																)}
																columns={APPOINTMENT_COLUMNS}
																defaultDensity="compact"
																rowActions={(row) => (
																	<IconButton
																		aria-label={`Actions for ${row.patient}`}
																		variant="ghost"
																	>
																		<Icon name="ellipsis" size={16} />
																	</IconButton>
																)}
																rowKey={(row) => row.id}
																rows={APPOINTMENTS}
																selectable
															/>
														),
													},
													{
														value: "waitlist",
														label: "Waitlist",
														count: 4,
														content: (
															<div className="lemn-brand-preview__waitlist">
																<span>
																	<Avatar color="teal" size={32}>
																		LM
																	</Avatar>
																	<span>
																		<strong>Leo Martin</strong>
																		<small>Available after 14:00</small>
																	</span>
																</span>
																<Button size="sm" variant="outline">
																	Offer slot
																</Button>
															</div>
														),
													},
												]}
											/>
										</Card>

										<Card
											className="lemn-brand-preview__booking-card"
											title="Quick booking"
										>
											<form
												onSubmit={(event) => {
													event.preventDefault();
													setBookingSaved(true);
												}}
											>
												<Field label="Patient" required>
													{(control) => (
														<Input {...control} defaultValue="Avery Quinn" />
													)}
												</Field>
												<Field label="Service">
													{(control) => (
														<SelectNative
															{...control}
															defaultValue="consultation"
															options={[
																{
																	label: "Initial consultation",
																	value: "consultation",
																},
																{
																	label: "Follow-up visit",
																	value: "follow-up",
																},
																{ label: "Therapy session", value: "therapy" },
															]}
														/>
													)}
												</Field>
												<Field hint="Visible to the care team" label="Note">
													{(control) => (
														<Textarea
															{...control}
															defaultValue="Prefers an afternoon appointment."
															rows={2}
														/>
													)}
												</Field>
												<div className="lemn-brand-preview__booking-options">
													<span>
														<span>
															<strong>Automatic reminders</strong>
															<small>Email and SMS</small>
														</span>
														<Toggle
															aria-label="Automatic reminders"
															checked={remindersEnabled}
															onCheckedChange={setRemindersEnabled}
														/>
													</span>
													<span className="lemn-brand-preview__check">
														<Checkbox defaultChecked id={reminderId} />
														<label htmlFor={reminderId}>
															Add to cancellation waitlist
														</label>
													</span>
												</div>
												{bookingSaved ? (
													<Alert
														message="The draft appointment is ready for review."
														title="Booking prepared"
														variant="success"
													/>
												) : null}
												<div className="lemn-brand-preview__form-actions">
													<Button type="submit">Create appointment</Button>
													<Button type="button" variant="ghost">
														Reset form
													</Button>
												</div>
											</form>
										</Card>
									</div>

									<Card className="lemn-brand-preview__signal-card">
										<div>
											<span>
												<strong>Patient experience</strong>
												<small>
													Average response time is down 18% this month.
												</small>
											</span>
											<Badge tone="success" variant="soft">
												Healthy
											</Badge>
										</div>
										<Sparkline
											aria-label="Patient experience trend"
											points={[42, 48, 45, 57, 62, 68, 76, 73, 84, 91]}
										/>
									</Card>
								</main>
							</div>
						</div>
					</div>
				) : (
					<div className="lemn-brand-studio__preview-fallback">
						<Alert
							message={
								compiling
									? "Applying the current BrandingDefinition."
									: "Resolve blocking diagnostics to compile this mode."
							}
							title={compiling ? "Compiling preview" : "Preview unavailable"}
							variant={compiling ? "info" : "error"}
						/>
					</div>
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
