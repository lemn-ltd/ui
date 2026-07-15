import { BrandStudio, type BrandStudioHostStatus } from "@lemn-ltd/brand-studio";
import { Alert, ContentLayout } from "@lemn-ltd/ui";
import { type ReactElement, useState } from "react";
import { useShowcaseBrand } from "../../branding/brand-runtime";

export function PublicBrandStudioPage(): ReactElement {
	const { project, updateProject } = useShowcaseBrand();
	const [hostStatus, setHostStatus] = useState<BrandStudioHostStatus>({
		state: "idle",
		message: "Changes are ephemeral and never leave this browser session.",
	});

	return (
		<ContentLayout className="showcase-ecosystem-page showcase-brand-studio-page">
			<Alert
				message="This public Studio compiles a controlled BrandProject in memory. It has no persistence, authentication, publication, or control-plane authority."
				title="Ephemeral public sandbox"
				variant="info"
			/>
			<BrandStudio
				hostStatus={hostStatus}
				onChange={updateProject}
				onIntent={(intent) => {
					if (intent.type === "validate") {
						const errors = intent.compileResult.diagnostics.filter(
							(diagnostic) => diagnostic.severity === "error",
						);
						setHostStatus({
							state: errors.length === 0 ? "success" : "error",
							message:
								errors.length === 0
									? "The canonical compiler accepts this contract."
									: `${errors.length} blocking diagnostics must be resolved.`,
						});
						return;
					}
					setHostStatus({
						state: "error",
						message:
							"Publication is intentionally unavailable in the public Showcase. Use the Access-protected Admin host.",
					});
				}}
				value={project}
			/>
		</ContentLayout>
	);
}
