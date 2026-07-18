import { expect, gotoStable, test } from "../helpers/deterministic";

test("public routes do not request protected Admin modules", async ({
	page,
}) => {
	const adminRequests: string[] = [];
	page.on("request", (request) => {
		const pathname = new URL(request.url()).pathname;
		if (
			pathname.startsWith("/admin-assets/") ||
			pathname.includes("/src/client/modules/admin/")
		) {
			adminRequests.push(pathname);
		}
	});

	await gotoStable(page, "/");
	await gotoStable(page, "/components/button");
	await gotoStable(page, "/blocks");

	expect(adminRequests).toEqual([]);
});
