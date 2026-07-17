import { z } from "zod";
import { BrandingPreviewUnavailableError } from "./errors.js";
import type { BrandingPreviewSelection } from "./types.js";

const previewSelectionSchema = z
	.object({
		workspaceId: z.string().trim().min(1).max(200),
		sessionId: z.string().trim().min(16).max(300),
		sessionBearer: z.string().regex(/^[A-Za-z0-9_-]{32,512}$/),
		draftTitle: z.string().trim().min(1).max(160),
		definitionHash: z.string().regex(/^[a-f0-9]{64}$/),
		expiresAt: z.string().datetime({ offset: true }),
		initialModeId: z.string().trim().min(1).max(200).optional(),
	})
	.strict();

/**
 * Validates claims only after the host has authenticated and decoded its own
 * HttpOnly preview cookie. Cookie names, signatures, rotation, and routing stay
 * owned by the consumer application.
 */
export function validateBrandingPreviewSelection(
	input: unknown,
	expectedWorkspaceId: string,
	now = new Date(),
): BrandingPreviewSelection {
	const result = previewSelectionSchema.safeParse(input);
	if (!result.success) {
		throw new BrandingPreviewUnavailableError(
			"The branding preview selection is invalid",
		);
	}
	if (result.data.workspaceId !== expectedWorkspaceId) {
		throw new BrandingPreviewUnavailableError(
			"The branding preview belongs to another Workspace",
		);
	}
	if (new Date(result.data.expiresAt).getTime() <= now.getTime()) {
		throw new BrandingPreviewUnavailableError(
			"The branding preview has expired",
		);
	}
	return Object.freeze(result.data);
}
