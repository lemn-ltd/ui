import AxeBuilder from "@axe-core/playwright";
import type { Locator, Page } from "@playwright/test";
import {
	gotoReadyAdminBrandStudio,
	newAdminDeterministicPage,
	selectPreviewMode,
} from "../helpers/admin";
import { expect, type Theme, test } from "../helpers/deterministic";

const ACCESSIBILITY_CASES = [
	{
		name: "desktop light",
		theme: "light",
		viewport: { width: 1280, height: 900 },
	},
	{
		name: "desktop dark",
		theme: "dark",
		viewport: { width: 1280, height: 900 },
	},
	{
		name: "mobile light",
		theme: "light",
		viewport: { width: 375, height: 812 },
	},
	{
		name: "mobile dark",
		theme: "dark",
		viewport: { width: 375, height: 812 },
	},
] as const satisfies readonly {
	readonly name: string;
	readonly theme: Theme;
	readonly viewport: { readonly width: number; readonly height: number };
}[];

async function exerciseSemanticInteractions(
	page: Page,
	preview: Locator,
): Promise<void> {
	await expect(
		preview.getByRole("heading", { name: "Good morning, Maya" }),
	).toBeVisible();
	await expect(preview.getByLabel("Today at a glance")).toBeVisible();
	await expect(
		preview.getByRole("region", {
			name: "Bookings and completed visits",
		}),
	).toBeVisible();
	await expect(
		preview.getByRole("region", { name: "Appointments by service" }),
	).toBeVisible();
	await expect(
		preview.getByRole("tablist", { name: "Appointment queues" }),
	).toBeVisible();

	const month = preview.getByRole("radio", { name: "Month", exact: true });
	await month.focus();
	await page.keyboard.press("Space");
	await expect(month).toBeChecked();

	const waitlist = preview.getByRole("tab", { name: /Waitlist/u });
	await waitlist.focus();
	await page.keyboard.press("Enter");
	await expect(waitlist).toHaveAttribute("aria-selected", "true");
	await expect(
		preview.getByText("Available after 14:00", { exact: true }),
	).toBeVisible();

	const reminders = preview.getByRole("switch", {
		name: "Automatic reminders",
	});
	await expect(reminders).toHaveAttribute("aria-checked", "true");
	await reminders.focus();
	await page.keyboard.press("Space");
	await expect(reminders).toHaveAttribute("aria-checked", "false");

	const cancellationWaitlist = preview.getByRole("checkbox", {
		name: "Add to cancellation waitlist",
	});
	await expect(cancellationWaitlist).toBeChecked();
	await cancellationWaitlist.click();
	await expect(cancellationWaitlist).not.toBeChecked();

	await preview.getByRole("button", { name: "Create appointment" }).click();
	await expect(
		preview.getByText("Booking prepared", { exact: true }),
	).toBeVisible();
}

test.describe("protected Brand Studio preview accessibility", () => {
	for (const accessibilityCase of ACCESSIBILITY_CASES) {
		test(`has no serious accessibility violations and remains operable in ${accessibilityCase.name}`, async ({
			browser,
		}, testInfo) => {
			const { context, page } = await newAdminDeterministicPage(
				browser,
				testInfo,
				accessibilityCase,
			);
			try {
				const preview = await gotoReadyAdminBrandStudio(page);
				await selectPreviewMode(page, preview, accessibilityCase.theme);
				await exerciseSemanticInteractions(page, preview);

				const results = await new AxeBuilder({ page })
					.include('[aria-label="Live branding preview"]')
					.analyze();
				const seriousViolations = results.violations.filter(
					(violation) =>
						violation.impact === "critical" || violation.impact === "serious",
				);
				expect(
					seriousViolations,
					seriousViolations
						.map((violation) => `${violation.id}: ${violation.help}`)
						.join(" | "),
				).toEqual([]);
			} finally {
				await context.close();
			}
		});
	}
});
