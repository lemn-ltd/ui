import { ContentLayout } from "@lemn-ltd/ui";
import {
	AppointmentScheduleBlock,
	DashboardOverviewBlock,
} from "@lemn-ltd/ui/blocks/core";
import { type ReactElement, useState } from "react";
import { Link } from "react-router-dom";
import { catalogSectionManifestEntry } from "../../../catalog/catalog-manifest.js";
import { CATALOG_REGISTRY } from "../../registry/catalog-registry.js";

const TREND = [
	{ month: "Jan", bookings: 42 },
	{ month: "Feb", bookings: 56 },
	{ month: "Mar", bookings: 61 },
	{ month: "Apr", bookings: 74 },
];

function DashboardBlockPreview(): ReactElement {
	return (
		<DashboardOverviewBlock
			description="A Recharts-backed trend and ranking share the active compiled palette."
			metrics={[
				{
					id: "bookings",
					label: "Bookings",
					value: "1,284",
					delta: { direction: "up", label: "+12%" },
				},
				{
					id: "completion",
					label: "Completion",
					value: "92%",
					delta: { direction: "up", label: "+4%" },
				},
				{
					id: "wait",
					label: "Median wait",
					value: "8 min",
					delta: { direction: "down", label: "-2 min" },
				},
			]}
			rankingItems={[
				{ label: "Consultations", value: 74 },
				{ label: "Follow-ups", value: 48 },
				{ label: "Screenings", value: 31 },
			]}
			trendData={TREND}
			trendIndex="month"
			trendSeries={[{ dataKey: "bookings", name: "Bookings" }]}
		/>
	);
}

function AppointmentBlockPreview(): ReactElement {
	const [appointments, setAppointments] = useState([
		{
			id: "a1",
			patient: "Maya Chen",
			practitioner: "Dr. Rivera",
			service: "Consultation",
			startLabel: "Today · 10:30",
			status: "confirmed" as const,
		},
		{
			id: "a2",
			patient: "Noah Williams",
			practitioner: "Dr. Rivera",
			service: "Follow-up",
			startLabel: "Today · 12:00",
			status: "pending" as const,
		},
	]);
	return (
		<AppointmentScheduleBlock
			items={appointments}
			onOpen={(id) =>
				setAppointments((items) => items.filter((item) => item.id !== id))
			}
		/>
	);
}

const BLOCK_PREVIEWS: Readonly<Record<string, () => ReactElement>> = {
	"dashboard-overview": DashboardBlockPreview,
	"appointment-schedule": AppointmentBlockPreview,
};

export interface BlocksPageProps {
	readonly selectedSlug?: string;
}

export function BlocksPage({ selectedSlug }: BlocksPageProps = {}): ReactElement {
	const blockEntries = CATALOG_REGISTRY.filter(
		(entry) => entry.kind === "block",
	);
	const selected = selectedSlug
		? blockEntries.find((entry) => entry.slug === selectedSlug)
		: undefined;
	const blockSection = catalogSectionManifestEntry("blocks");
	if (selectedSlug && !selected) {
		return (
			<ContentLayout className="portal-ecosystem-page">
				<h1>Block not found</h1>
				<p>This block is not part of the active Core catalog.</p>
				<Link to={blockSection.path}>Return to blocks</Link>
			</ContentLayout>
		);
	}

	const entries = selected ? [selected] : blockEntries;
	return (
		<ContentLayout className="portal-ecosystem-page">
			<header className="portal-ecosystem-page__header">
				<span>Curated blocks</span>
				<h1>{selected?.title ?? "Purpose-built compositions"}</h1>
				<p>
					{selected?.summary ??
						`${blockEntries.length} Core blocks combine public components while hosts retain data and business actions.`}
				</p>
			</header>
			<div className="portal-block-gallery">
				{entries.map((entry) => {
					const Preview = BLOCK_PREVIEWS[entry.slug];
					if (!Preview) return null;
					return (
						<article key={entry.slug}>
							{selected ? null : (
								<h2>
									<Link to={entry.path}>{entry.title}</Link>
								</h2>
							)}
							<Preview />
						</article>
					);
				})}
			</div>
		</ContentLayout>
	);
}
