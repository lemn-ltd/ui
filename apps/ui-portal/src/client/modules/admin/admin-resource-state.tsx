import { Alert, Button } from "@lemn-ltd/ui";
import type { ReactElement } from "react";
import { AdminApiError } from "./api";

export type AdminResourceState<T> =
	| { readonly state: "loading" }
	| {
			readonly state: "error";
			readonly message: string;
			readonly status?: number;
			readonly code?: string;
			readonly requestId?: string;
	  }
	| { readonly state: "success"; readonly data: T };

export function toAdminResourceFailure(
	error: unknown,
	fallback: string,
): AdminResourceState<never> {
	return {
		state: "error",
		message: error instanceof Error ? error.message : fallback,
		...(error instanceof AdminApiError
			? {
					status: error.status,
					...(error.code ? { code: error.code } : {}),
					...(error.requestId ? { requestId: error.requestId } : {}),
				}
			: {}),
	};
}

export function AdminLoadingState({
	message,
}: {
	readonly message: string;
}): ReactElement {
	return (
		<div className="admin-loading" role="status">
			{message}
		</div>
	);
}

export function AdminEmptyState({
	detail,
	title,
}: {
	readonly detail: string;
	readonly title: string;
}): ReactElement {
	return (
		<div className="admin-empty-state" role="status">
			<strong>{title}</strong>
			<span>{detail}</span>
		</div>
	);
}

export function AdminResourceError({
	error,
	onRetry,
}: {
	readonly error: Extract<AdminResourceState<unknown>, { state: "error" }>;
	readonly onRetry: () => void;
}): ReactElement {
	return (
		<div className="admin-error-state">
			<Alert
				message={error.message}
				title="Admin data unavailable"
				variant="error"
			/>
			{error.requestId ? (
				<small>
					Support request <code>{error.requestId}</code>
				</small>
			) : null}
			<Button onClick={onRetry}>Retry</Button>
		</div>
	);
}
