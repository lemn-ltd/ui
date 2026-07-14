import assert from "node:assert/strict";
import test from "node:test";
import { assertPackageVersionUnpublished } from "../../scripts/release/check-unpublished-package-version.ts";

const input = {
	owner: "lemn-ltd",
	packageName: "@lemn-ltd/ui",
	version: "0.1.2",
	token: "contract-github-token",
};

function response(payload: unknown, status = 200): Response {
	return Response.json(payload, { status });
}

test("accepts 0.1.2 only when an authenticated version list omits it", async () => {
	const requests: URL[] = [];
	await assertPackageVersionUnpublished({
		...input,
		fetchImplementation: async (request, init) => {
			requests.push(new URL(String(request)));
			assert.equal(
				new Headers(init?.headers).get("Authorization"),
				`Bearer ${input.token}`,
			);
			return response([{ name: "0.1.1" }, { name: "0.1.0" }]);
		},
	});
	assert.equal(requests.length, 1);
	assert.equal(
		requests[0]?.pathname,
		"/orgs/lemn-ltd/packages/npm/ui/versions",
	);
});

test("rejects an already published 0.1.2 and requires a new changeset", async () => {
	await assert.rejects(
		assertPackageVersionUnpublished({
			...input,
			fetchImplementation: async () => response([{ name: "0.1.2" }]),
		}),
		/already published; package changes require a changeset/u,
	);
});

test("fails closed when a 200 version response has a malformed item", async () => {
	await assert.rejects(
		assertPackageVersionUnpublished({
			...input,
			fetchImplementation: async () => response([{ unexpected: "shape" }]),
		}),
		/malformed version at index 0/u,
	);
});

test("fails closed when a 200 version response mixes valid and malformed items", async () => {
	await assert.rejects(
		assertPackageVersionUnpublished({
			...input,
			fetchImplementation: async () =>
				response([{ name: "0.1.1" }, { name: 12 }]),
		}),
		/malformed version at index 1/u,
	);
});

test("fails closed when a 200 version response duplicates a version", async () => {
	await assert.rejects(
		assertPackageVersionUnpublished({
			...input,
			fetchImplementation: async () =>
				response([{ name: "0.1.1" }, { name: "0.1.1" }]),
		}),
		/duplicate version 0\.1\.1/u,
	);
});

test("does not misclassify a package-level 404 as an unpublished version", async () => {
	await assert.rejects(
		assertPackageVersionUnpublished({
			...input,
			fetchImplementation: async () => response({}, 404),
		}),
		/HTTP 404 for the package.*cannot be verified/u,
	);
});

test("reports authentication failures separately from package absence", async () => {
	await assert.rejects(
		assertPackageVersionUnpublished({
			...input,
			fetchImplementation: async () => response({}, 403),
		}),
		/authentication or authorization failed with HTTP 403/u,
	);
});

test("reports network failures without leaking the token", async () => {
	await assert.rejects(
		assertPackageVersionUnpublished({
			...input,
			fetchImplementation: async () => {
				throw new Error(input.token);
			},
		}),
		(error: unknown) => {
			assert.ok(error instanceof Error);
			assert.match(error.message, /failed before receiving a response/u);
			assert.doesNotMatch(error.message, new RegExp(input.token, "u"));
			return true;
		},
	);
});
