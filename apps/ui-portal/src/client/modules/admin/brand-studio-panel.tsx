import { compileBrandingDefinition } from "@lemn-ltd/brand-contract";
import {
	getSystemBrandingTemplate,
	systemBrandingTemplates,
} from "@lemn-ltd/brand-contract/system-brandings";
import {
	BrandStudio,
	type BrandStudioDraftContext,
	type BrandStudioHostStatus,
	type BrandStudioIntent,
} from "@lemn-ltd/brand-studio";
import { Alert } from "@lemn-ltd/ui";
import { type ReactElement, useMemo, useState } from "react";

const initialTemplate = getSystemBrandingTemplate("aster-vault", 1);

export function BrandStudioPanel(): ReactElement {
	const [definition, setDefinition] = useState(() =>
		structuredClone(initialTemplate.definition),
	);
	const [draftTitle, setDraftTitle] = useState("Protected Studio experiment");
	const [definitionHash, setDefinitionHash] = useState(
		initialTemplate.definitionHash,
	);
	const [archived, setArchived] = useState(false);
	const [status, setStatus] = useState<BrandStudioHostStatus>({
		state: "idle",
		message: "The protected host keeps this experiment in React state only.",
	});

	const draft = useMemo<BrandStudioDraftContext>(
		() => ({
			brandingVersionId: "portal-admin-ephemeral-version",
			title: draftTitle,
			definitionHash,
			state: "draft",
			archived,
		}),
		[archived, definitionHash, draftTitle],
	);

	const dispatch = async (intent: BrandStudioIntent): Promise<void> => {
		if (intent.type === "select-system-branding") {
			const template = getSystemBrandingTemplate(
				intent.templateId,
				intent.templateVersion,
			);
			setDefinition(structuredClone(template.definition));
			setDefinitionHash(template.definitionHash);
			setDraftTitle(`${template.name} experiment`);
			setArchived(false);
			setStatus({
				state: "saved",
				message: `Loaded an editable copy of ${template.name} · v${template.version}.`,
			});
			return;
		}
		if (intent.type === "validate") {
			const errors = intent.compileResult.diagnostics.filter(
				(diagnostic) => diagnostic.severity === "error",
			);
			setStatus({
				state: errors.length ? "invalid" : "saved",
				message: errors.length
					? `${errors.length} blocking diagnostics must be resolved.`
					: "The canonical compiler accepts this BrandingDefinition.",
			});
			return;
		}
		if (intent.type === "save-draft") {
			setStatus({ state: "saving", message: "Creating a local checkpoint…" });
			const compiled = await compileBrandingDefinition(intent.definition);
			if (!compiled.ok) {
				setStatus({
					state: "invalid",
					message: "Blocking diagnostics prevented the local checkpoint.",
				});
				return;
			}
			setDefinitionHash(compiled.artifact.definitionHash);
			setDraftTitle(intent.title);
			setStatus({
				state: "saved",
				message: `Local checkpoint ${compiled.artifact.definitionHash.slice(0, 12)} saved in memory.`,
			});
			return;
		}
		if (intent.type === "compare-draft") {
			setStatus({
				state: "idle",
				message:
					intent.definitionHash === definitionHash
						? "The editor matches the local checkpoint."
						: "The editor differs from the local checkpoint.",
			});
			return;
		}
		if (intent.type === "create-preview") {
			setStatus({
				state: "preview-ready",
				message: `Preview contract pinned to ${intent.definitionHash.slice(0, 12)} for ${intent.targetId}.`,
			});
			return;
		}
		if (intent.type === "archive-draft" || intent.type === "restore-draft") {
			const nextArchived = intent.type === "archive-draft";
			setArchived(nextArchived);
			setStatus({
				state: nextArchived ? "archived" : "saved",
				message: nextArchived
					? "The local experiment is archived and read-only."
					: "The local experiment is restored.",
			});
			return;
		}
		setStatus({
			state: "permission-denied",
			message:
				"Publication belongs to AgentOps. Portal Admin intentionally has no publication authority.",
		});
	};

	return (
		<section aria-labelledby="admin-studio-title" className="admin-studio">
			<header className="admin-studio__header">
				<div>
					<span>Protected, persistence-free reference host</span>
					<h2 id="admin-studio-title">Brand Studio contract lab</h2>
				</div>
			</header>
			<Alert
				message="This host demonstrates controlled edits, exact System branding selection, validation, local checkpoints, preview intents, and lifecycle states. AgentOps owns durable Workspace data and publication."
				title="Explicit authority boundary"
				variant="info"
			/>
			<BrandStudio
				draft={draft}
				hostStatus={status}
				onChange={(next) => {
					setDefinition(next);
					setStatus({ state: "dirty", message: "Unsaved local changes." });
				}}
				onDraftTitleChange={setDraftTitle}
				onIntent={dispatch}
				previewTargets={[
					{
						id: "public-portal",
						name: "Public Portal",
						origin: "https://portal.ui.le-mn.com",
						status: "active",
					},
				]}
				systemBrandings={systemBrandingTemplates}
				value={definition}
			/>
		</section>
	);
}
