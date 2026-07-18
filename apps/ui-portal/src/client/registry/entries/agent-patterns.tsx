import { lazy } from "react";
import type { DisabledAgentSourceEntry } from "../disabled-agent-entry.js";

const AgentSessionPage = lazy(
	() => import("../../pages/agents/patterns/agent-session.page.js"),
);
const AutomationBuilderPage = lazy(
	() => import("../../pages/agents/patterns/automation-builder.page.js"),
);
const RunMonitorPage = lazy(
	() => import("../../pages/agents/patterns/run-monitor.page.js"),
);

export const agentPatternsEntries: DisabledAgentSourceEntry[] = [
	{
		area: "agents",
		slug: "agent-session",
		title: "Agent session",
		group: "Patterns",
		kind: "pattern",
		summary:
			"A focused conversation surface with activity, user and agent bubbles, reasoning, tool calls, and a composer.",
		status: "beta",
		page: () => <AgentSessionPage />,
	},
	{
		area: "agents",
		slug: "automation-builder",
		title: "Automation builder",
		group: "Patterns",
		kind: "pattern",
		summary:
			"A graph authoring workflow with triggers, node palette, canvas, inspector, planner status, and proposal review.",
		status: "beta",
		page: () => <AutomationBuilderPage />,
	},
	{
		area: "agents",
		slug: "run-monitor",
		title: "Run monitor",
		group: "Patterns",
		kind: "pattern",
		summary:
			"An execution monitoring surface with run status, timeline evidence, attempts, runtime refs, and approval context.",
		status: "beta",
		page: () => <RunMonitorPage />,
	},
];
