import {
	getSystemBrandingTemplate,
	systemBrandingTemplates,
} from "@lemn-ltd/brand-contract/system-brandings";
import {
	BrandStudio,
	type BrandStudioDraftContext,
	type BrandStudioHostStatus,
} from "@lemn-ltd/brand-studio";
import { Alert, ContentLayout } from "@lemn-ltd/ui";
import { type ReactElement, useState } from "react";
import { useShowcaseBrand } from "../../branding/brand-runtime";

export function PublicBrandStudioPage(): ReactElement {
	const { artifact, definition, setDefinition } = useShowcaseBrand();
	const [draftTitle, setDraftTitle] = useState("Showcase experiment");
	const [savedHash, setSavedHash] = useState(artifact.definitionHash);
	const [hostStatus, setHostStatus] = useState<BrandStudioHostStatus>({
		state: "idle",
		message: "Changes are ephemeral and never leave this browser session.",
	});
	const draft: BrandStudioDraftContext = {
		brandingVersionId: "showcase-ephemeral-draft",
		title: draftTitle,
		definitionHash: savedHash,
		state: "draft",
		archived: false,
	};

	return (
		<ContentLayout className="showcase-ecosystem-page showcase-brand-studio-page">
			<Alert
				message="This public Studio compiles one controlled BrandingDefinition in memory. It has no persistence, authentication, publication, or control-plane authority."
				title="Ephemeral public sandbox"
				variant="info"
			/>
			<BrandStudio
				draft={draft}
				hostStatus={hostStatus}
				onChange={setDefinition}
				onDraftTitleChange={setDraftTitle}
				onIntent={(intent) => {
					if (intent.type === "validate") {
						const errors = intent.compileResult.diagnostics.filter(
							(diagnostic) => diagnostic.severity === "error",
						);
						setHostStatus({
							state: errors.length === 0 ? "saved" : "invalid",
							message:
								errors.length === 0
									? "The canonical compiler accepts this contract."
									: `${errors.length} blocking diagnostics must be resolved.`,
						});
						return;
					}
					if (intent.type === "select-system-branding") {
						const template = getSystemBrandingTemplate(
							intent.templateId,
							intent.templateVersion,
						);
						setDefinition(structuredClone(template.definition));
						setSavedHash(template.definitionHash);
						setDraftTitle(`${template.name} experiment`);
						setHostStatus({
							state: "saved",
							message: `Loaded the immutable ${template.name} · v${template.version} starting point.`,
						});
						return;
					}
					setHostStatus({
						state: "permission-denied",
						message:
							"Persistence and lifecycle actions are intentionally unavailable in the public Showcase.",
					});
				}}
				systemBrandings={systemBrandingTemplates}
				value={definition}
			/>
		</ContentLayout>
	);
}
