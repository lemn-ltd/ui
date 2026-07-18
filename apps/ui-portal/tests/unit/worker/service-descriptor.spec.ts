import { describe, expect, it } from "vitest";
import { uiPortalAppDescriptor } from "../../../src/app-descriptor";
import { uiPortalServiceDescriptor } from "../../../src/worker/service-descriptor";

describe("ui portal service descriptor", () => {
	it("keeps product, package, Worker, and domain identities explicit", () => {
		expect(uiPortalServiceDescriptor).toMatchObject({
			name: uiPortalAppDescriptor.name,
			displayName: uiPortalAppDescriptor.displayName,
			ownerPackage: "@lemn-ltd/ui-portal",
			workerName: "lemn-ui-portal",
			publicOrigin: "https://portal.ui.le-mn.com",
			schemaOrigin: "https://schemas.ui.le-mn.com",
		});
	});
});
