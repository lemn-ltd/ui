import {
	AppointmentScheduleBlock,
	ApprovalQueueBlock,
	blockCatalog,
	ContentLayout,
	DashboardOverviewBlock,
} from "@lemn-ltd/ui";
import { type ReactElement, useState } from "react";

const TREND = [
	{ month: "Jan", bookings: 42 },
	{ month: "Feb", bookings: 56 },
	{ month: "Mar", bookings: 61 },
	{ month: "Apr", bookings: 74 },
];

export function BlocksPage(): ReactElement {
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
	const [requests, setRequests] = useState([
		{
			hitlRequestId: "approval-1",
			kind: "approval" as const,
			mode: "confirmation" as const,
			prompt: "Publish the reviewed provider mapping proposal?",
			capabilityRef: "ui.visualization.heatmap",
			risk: "medium" as const,
		},
	]);

	return (
		<ContentLayout className="showcase-ecosystem-page">
			<header className="showcase-ecosystem-page__header">
				<span>Curated blocks</span>
				<h1>Purpose-built compositions</h1>
				<p>
					{blockCatalog.length} blocks combine public components while hosts
					retain data and business actions.
				</p>
			</header>
			<div className="showcase-block-gallery">
				<article>
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
				</article>
				<article>
					<AppointmentScheduleBlock
						items={appointments}
						onOpen={(id) =>
							setAppointments((items) => items.filter((item) => item.id !== id))
						}
					/>
				</article>
				<article>
					<ApprovalQueueBlock
						onApprove={(id) =>
							setRequests((items) =>
								items.filter((item) => item.hitlRequestId !== id),
							)
						}
						onReject={(id) =>
							setRequests((items) =>
								items.filter((item) => item.hitlRequestId !== id),
							)
						}
						requests={requests}
					/>
				</article>
			</div>
		</ContentLayout>
	);
}
