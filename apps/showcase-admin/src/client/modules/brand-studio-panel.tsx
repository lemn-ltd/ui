import {
	type BrandCompileResult,
	type BrandProject,
} from "@lemn-ltd/brand-contract";
import {
	BrandStudio,
	createBrandFromPreset,
	type BrandStudioHostAdapter,
	type BrandStudioHostStatus,
	type BrandStudioIntent,
} from "@lemn-ltd/brand-studio";
import { Alert, Input, SelectNative } from "@lemn-ltd/ui";
import {
	type ReactElement,
	useMemo,
	useState,
} from "react";
import { adminApi, type SimulatorContext, type SimulatorPlan } from "../api";

const INITIAL_CONTEXT: SimulatorContext = {
	projectId: "019b7af3-0f8f-7e21-86c4-10fcfd5cb40a",
	environmentId: "019b7af3-0f8f-7e21-86c4-10fcfd5cb40b",
	environmentKind: "development",
	brandId: "019b7af3-0f8f-7e21-86c4-10fcfd5cb40c",
	revisionId: null,
	assignmentSequence: 0,
};

function compileStatus(result: BrandCompileResult): BrandStudioHostStatus {
	const errors = result.diagnostics.filter((diagnostic) => diagnostic.severity === "error");
	return errors.length === 0
		? { state: "success", message: "The draft is valid and compiles without blocking diagnostics." }
		: { state: "error", message: `${errors.length} blocking diagnostics must be resolved.` };
}

export function BrandStudioPanel(): ReactElement {
	const [project, setProject] = useState<BrandProject>(() =>
		createBrandFromPreset("aster-vault", { name: "Simulator project brand" }),
	);
	const [context, setContext] = useState<SimulatorContext>(INITIAL_CONTEXT);
	const [status, setStatus] = useState<BrandStudioHostStatus>({ state: "idle" });
	const [approvedPlan, setApprovedPlan] = useState<SimulatorPlan>();
	const [applyReceipt, setApplyReceipt] = useState<{ readonly id?: string; readonly state: string }>();

	const dispatch = async (intent: BrandStudioIntent): Promise<void> => {
		if (intent.type === "validate") {
			setStatus(compileStatus(intent.compileResult));
			return;
		}

		if (intent.type === "plan-publication") {
			setStatus({ state: "pending", message: "Saving the draft and requesting an authoritative publication plan…" });
			setApprovedPlan(undefined);
			setApplyReceipt(undefined);
			try {
				const plan = await adminApi.plan(context, intent.draft);
				setApprovedPlan(plan);
				setContext((current) => ({
					...current,
					draftId: plan.draft.id,
					draftVersion: plan.draft.version,
				}));
				setStatus({
					state: "success",
					message: `Plan ${plan.id} is ready for review and expires ${new Date(plan.expiresAt).toLocaleString()}.`,
					expectedRevision: plan.expectedAssignmentSequence,
				});
			} catch (error) {
				setStatus({ state: "error", message: error instanceof Error ? error.message : "The simulator plan failed." });
			}
			return;
		}

		if (!approvedPlan) {
			setStatus({ state: "error", message: "Create and review a publication plan before applying it." });
			return;
		}
		setStatus({ state: "pending", message: "Applying the approved plan through the protected simulator binding…" });
		try {
			const receipt = await adminApi.apply(approvedPlan.id, intent.idempotencyKey);
			setApplyReceipt(receipt);
			setContext((current) => ({
				...current,
				assignmentSequence: approvedPlan.expectedAssignmentSequence + 1,
			}));
			setStatus({ state: "success", message: `Simulator accepted the publication (${receipt.state}).` });
		} catch (error) {
			setStatus({ state: "error", message: error instanceof Error ? error.message : "The simulator apply failed." });
		}
	};

	const adapter = useMemo<BrandStudioHostAdapter>(() => ({ status, dispatch }), [status, approvedPlan, context]);

	return (
		<section className="admin-studio" aria-labelledby="admin-studio-title">
			<header className="admin-studio__header">
				<div><span>Ephemeral authoring, protected publication</span><h2 id="admin-studio-title">Brand Studio simulator host</h2></div>
			</header>
			<Alert
				message="Edits stay in this browser's React state. Plan and apply cross the Admin Worker through a Cloudflare Service Binding; no browser token is accepted or stored."
				title="Zero-trust host boundary"
				variant="info"
			/>
			<div className="admin-context" aria-label="Simulator publication context">
				<label><span>Project ID</span><Input aria-label="Simulator project ID" onChange={(event) => setContext((current) => ({ ...current, projectId: event.currentTarget.value }))} value={context.projectId} /></label>
				<label><span>Environment ID</span><Input aria-label="Simulator environment ID" onChange={(event) => setContext((current) => ({ ...current, environmentId: event.currentTarget.value }))} value={context.environmentId} /></label>
				<label><span>Brand ID</span><Input aria-label="Simulator brand ID" onChange={(event) => setContext((current) => ({ ...current, brandId: event.currentTarget.value }))} value={context.brandId} /></label>
				<label><span>Environment</span><SelectNative aria-label="Simulator environment kind" onValueChange={(environmentKind) => setContext((current) => ({ ...current, environmentKind: environmentKind as SimulatorContext["environmentKind"] }))} options={["development", "staging", "production"].map((value) => ({ label: value, value }))} value={context.environmentKind} /></label>
				<label><span>Assignment sequence</span><Input aria-label="Simulator assignment sequence" min={0} onChange={(event) => setContext((current) => ({ ...current, assignmentSequence: Number(event.currentTarget.value) }))} type="number" value={String(context.assignmentSequence)} /></label>
			</div>
			{approvedPlan ? <p className="admin-plan-receipt"><strong>Approved plan:</strong> <code>{approvedPlan.id}</code> · draft <code>{approvedPlan.draft.id}@{approvedPlan.draft.version}</code></p> : null}
			{applyReceipt ? <p className="admin-plan-receipt" data-state="success"><strong>Apply receipt:</strong> {applyReceipt.state}{applyReceipt.id ? <> · <code>{applyReceipt.id}</code></> : null}</p> : null}
			<BrandStudio hostAdapter={adapter} onChange={setProject} value={project} />
		</section>
	);
}
