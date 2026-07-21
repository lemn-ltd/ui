import assert from "node:assert/strict";
import test from "node:test";
import {
	assertOnlyStagedReleaseMetadata,
	parseReleaseCommits,
	preparePackageRelease,
	releaseCommitForTrigger,
} from "../../scripts/release/prepare-package-release.ts";
import {
	assertArtifactIdentity,
	ensurePackageRelease,
	ensurePackageSetRelease,
	type PackageArtifact,
} from "../../scripts/release/publish-package-release.ts";

const triggerSha = "a".repeat(40);
const releaseSha = "b".repeat(40);
const committedSha = "c".repeat(40);
const buildTime = "2026-07-14T10:00:00Z";
const artifact: PackageArtifact = {
	packageName: "@lemn-ltd/ui",
	version: "0.1.3",
	integrity: `sha512-${Buffer.alloc(64, 1).toString("base64")}`,
};

function resumedReleaseDependencies() {
	let head = triggerSha;
	const commands: string[][] = [];
	let versionCalls = 0;
	return {
		commands,
		get versionCalls() {
			return versionCalls;
		},
		dependencies: {
			git(args: readonly string[]) {
				commands.push([...args]);
				if (args[0] === "fetch") return "";
				if (args[0] === "merge-base") return "";
				if (args[0] === "log") {
					return `${releaseSha}\x1fchore: release packages [skip ci]\n\nRelease-Origin: ${triggerSha}\nRelease-Id: @lemn-ltd/ui@0.1.3\x1e`;
				}
				if (args[0] === "checkout") {
					head = String(args[2]);
					return "";
				}
				if (args[0] === "rev-parse" && args[1] === "HEAD") return head;
				if (args[0] === "rev-parse") return releaseSha;
				if (args[0] === "show") return buildTime;
				throw new Error(`Unexpected git command: ${args.join(" ")}`);
			},
			async hasPendingChangesets() {
				return false;
			},
			async versionPackages() {
				versionCalls += 1;
			},
			async readPackageManifest() {
				return { name: artifact.packageName, version: artifact.version };
			},
			worktreeStatus() {
				return "";
			},
			async writeOutputs() {},
		},
	};
}

test("an old-SHA rerun adopts its existing release commit without creating a sibling", async () => {
	const fixture = resumedReleaseDependencies();
	const identity = await preparePackageRelease(
		{ triggerSha },
		fixture.dependencies,
	);
	assert.equal(identity.gitSha, releaseSha);
	assert.equal(identity.buildTime, buildTime);
	assert.equal(fixture.versionCalls, 0);
	assert.equal(
		fixture.commands.filter((args) => args[0] === "commit").length,
		0,
	);
	assert.equal(fixture.commands.filter((args) => args[0] === "push").length, 0);
});

test("workflow dispatch from latest main resumes without a changeset or release commit", async () => {
	const fixture = resumedReleaseDependencies();
	fixture.dependencies.git = (args: readonly string[]) => {
		fixture.commands.push([...args]);
		if (args[0] === "fetch") return "";
		if (args[0] === "rev-parse") return releaseSha;
		if (args[0] === "show") return buildTime;
		throw new Error(`Unexpected git command: ${args.join(" ")}`);
	};
	const identity = await preparePackageRelease(
		{ triggerSha: releaseSha },
		fixture.dependencies,
	);
	assert.equal(identity.gitSha, releaseSha);
	assert.equal(fixture.versionCalls, 0);
});

test("an old run cannot deploy its release commit after protected main advances again", async () => {
	const fixture = resumedReleaseDependencies();
	const latestSha = "d".repeat(40);
	const git = fixture.dependencies.git;
	fixture.dependencies.git = (args: readonly string[]) => {
		if (args[0] === "rev-parse" && args[1] === "refs/remotes/origin/main") {
			return latestSha;
		}
		return git(args);
	};
	await assert.rejects(
		preparePackageRelease({ triggerSha }, fixture.dependencies),
		/no longer latest protected main/u,
	);
	assert.equal(fixture.versionCalls, 0);
});

test("release metadata push is fast-forward-only and a non-FF failure stops", async () => {
	let head = triggerSha;
	let version = "0.1.2";
	let staged = false;
	const commands: string[][] = [];
	await assert.rejects(
		preparePackageRelease(
			{ triggerSha },
			{
				git(args) {
					commands.push([...args]);
					if (args[0] === "fetch" || args[0] === "config") {
						return "";
					}
					if (args[0] === "add") {
						staged = true;
						return "";
					}
					if (args[0] === "rev-parse" && args[1] === "HEAD") return head;
					if (args[0] === "rev-parse") return triggerSha;
					if (args[0] === "commit") {
						head = committedSha;
						staged = false;
						return "";
					}
					if (args[0] === "push") throw new Error("non-fast-forward");
					throw new Error(`Unexpected git command: ${args.join(" ")}`);
				},
				async hasPendingChangesets() {
					return true;
				},
				async versionPackages() {
					version = "0.1.3";
				},
				async readPackageManifest() {
					return { name: artifact.packageName, version };
				},
				worktreeStatus() {
					return staged ? "M  packages/ui/package.json" : "";
				},
				async writeOutputs() {},
			},
		),
		/non-fast-forward/u,
	);
	const push = commands.find((args) => args[0] === "push");
	assert.deepEqual(push, ["push", "origin", "HEAD:refs/heads/main"]);
	assert.equal(
		commands.some((args) => args.some((arg) => arg.includes("force"))),
		false,
	);
});

test("release preparation refuses omitted generated output before commit or push", async () => {
	const commands: string[][] = [];
	let afterVersioning = false;
	await assert.rejects(
		preparePackageRelease(
			{ triggerSha },
			{
				git(args) {
					commands.push([...args]);
					if (args[0] === "fetch" || args[0] === "add") return "";
					if (args[0] === "rev-parse") return triggerSha;
					throw new Error(`Unexpected git command: ${args.join(" ")}`);
				},
				async hasPendingChangesets() {
					return true;
				},
				async versionPackages() {
					afterVersioning = true;
				},
				async readPackageManifest() {
					return { name: artifact.packageName, version: artifact.version };
				},
				worktreeStatus() {
					return afterVersioning
						? "M  packages/ui/package.json\n?? apps/docs/generated-release.json"
						: "";
				},
				async writeOutputs() {},
			},
		),
		/unstaged or untracked release output/u,
	);
	assert.equal(
		commands.some((args) => args[0] === "commit"),
		false,
	);
	assert.equal(
		commands.some((args) => args[0] === "push"),
		false,
	);
});

test("release metadata status accepts only a non-empty staged set", () => {
	assert.doesNotThrow(() =>
		assertOnlyStagedReleaseMetadata(
			"M  packages/ui/package.json\nD  .changeset/ui-minor.md",
		),
	);
	assert.throws(
		() => assertOnlyStagedReleaseMetadata(""),
		/no release metadata changes/u,
	);
	assert.throws(
		() => assertOnlyStagedReleaseMetadata(" M apps/docs/package.json"),
		/unstaged or untracked release output/u,
	);
	assert.throws(
		() => assertOnlyStagedReleaseMetadata("M  README.md"),
		/outside the governed release metadata set/u,
	);
});

test("release commit matching is unique and trailer-bound", () => {
	const source = `${releaseSha}\x1fsubject\n\nRelease-Origin: ${triggerSha}\x1e`;
	assert.equal(
		releaseCommitForTrigger(parseReleaseCommits(source), triggerSha)?.sha,
		releaseSha,
	);
	assert.throws(
		() =>
			releaseCommitForTrigger(
				parseReleaseCommits(
					`${source}${committedSha}\x1fRelease-Origin: ${triggerSha}\x1e`,
				),
				triggerSha,
			),
		/Multiple release commits/u,
	);
});

test("failure after publish is reentrant and does not republish on rerun", async () => {
	let status: "published" | "unpublished" = "unpublished";
	let publishCalls = 0;
	let registryAvailable = false;
	const dependencies = {
		async packageStatus() {
			return status;
		},
		async publishedArtifact() {
			if (!registryAvailable) throw new Error("registry metadata unavailable");
			return artifact;
		},
		async publish() {
			publishCalls += 1;
			status = "published";
		},
		async wait() {},
	};
	await assert.rejects(
		ensurePackageRelease(artifact, dependencies),
		/could not be verified/u,
	);
	registryAvailable = true;
	assert.equal(await ensurePackageRelease(artifact, dependencies), "verified");
	assert.equal(publishCalls, 1);
});

test("an already-published package retries transient registry failures without republishing", async () => {
	let registryCalls = 0;
	let waitCalls = 0;
	const outcome = await ensurePackageRelease(artifact, {
		async packageStatus() {
			return "published";
		},
		async publishedArtifact() {
			registryCalls += 1;
			if (registryCalls === 1) {
				throw new Error("GitHub Packages registry request failed");
			}
			return artifact;
		},
		async publish() {
			throw new Error("must not republish immutable versions");
		},
		async wait() {
			waitCalls += 1;
		},
	});

	assert.equal(outcome, "verified");
	assert.equal(registryCalls, 2);
	assert.equal(waitCalls, 1);
});

test("an already-published mismatched tarball fails closed", async () => {
	const mismatched = {
		...artifact,
		integrity: `sha512-${Buffer.alloc(64, 2).toString("base64")}`,
	};
	await assert.rejects(
		ensurePackageRelease(artifact, {
			async packageStatus() {
				return "published";
			},
			async publishedArtifact() {
				return mismatched;
			},
			async publish() {
				throw new Error("must not republish");
			},
			async wait() {},
		}),
		/tarball does not match/u,
	);
	assert.throws(
		() => assertArtifactIdentity(artifact, mismatched),
		/tarball does not match/u,
	);
});

test("the immutable package set is verified strictly in contract then UI then Runtime then Studio order", async () => {
	const artifacts: PackageArtifact[] = [
		{ ...artifact, packageName: "@lemn-ltd/brand-contract", version: "0.1.0" },
		{ ...artifact, packageName: "@lemn-ltd/ui", version: "0.3.0" },
		{ ...artifact, packageName: "@lemn-ltd/brand-runtime", version: "0.1.0" },
		{ ...artifact, packageName: "@lemn-ltd/brand-studio", version: "0.1.0" },
	];
	const observed: string[] = [];
	const results = await ensurePackageSetRelease(artifacts, {
		async packageStatus(current) {
			observed.push(current.packageName);
			return "published";
		},
		async publishedArtifact(current) {
			return current;
		},
		async publish() {
			throw new Error("must not republish immutable versions");
		},
		async wait() {},
	});
	assert.deepEqual(observed, [
		"@lemn-ltd/brand-contract",
		"@lemn-ltd/ui",
		"@lemn-ltd/brand-runtime",
		"@lemn-ltd/brand-studio",
	]);
	assert.deepEqual(
		results.map(({ outcome }) => outcome),
		["verified", "verified", "verified", "verified"],
	);
});
