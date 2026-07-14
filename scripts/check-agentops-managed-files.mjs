import crypto from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

export const expectedManagedFilePaths = [
	"AGENTS.md",
	"patterns/pattern-audit.md",
	"patterns/pattern-profile.md",
	"patterns/pattern-system.md",
	"patterns/patterns.md",
];

function fail(message) {
	throw new Error(`AgentOps managed-file lock: ${message}`);
}

function record(value, description) {
	if (!value || typeof value !== "object" || Array.isArray(value)) {
		fail(`${description} must be an object`);
	}
	return value;
}

function checksum(content) {
	return `sha256:${crypto.createHash("sha256").update(content).digest("hex")}`;
}

export async function validateAgentOpsManagedFiles(root = process.cwd()) {
	const manifestPath = resolve(root, ".agentops/project.json");
	const manifest = record(
		JSON.parse(await readFile(manifestPath, "utf8")),
		"project manifest",
	);
	if (manifest.schemaVersion !== 2 || manifest.managedBy !== "agentops") {
		fail("project manifest must use AgentOps schema version 2");
	}

	const promptFiles = record(manifest.promptFiles, "promptFiles");
	if (promptFiles.mode !== "remote") {
		fail("promptFiles.mode must be remote");
	}
	if (!Array.isArray(promptFiles.files)) {
		fail("promptFiles.files must be an array");
	}

	const files = promptFiles.files.map((entry, index) =>
		record(entry, `promptFiles.files[${index}]`),
	);
	const paths = files.map((entry) => String(entry.targetPath ?? ""));
	const uniquePaths = [...new Set(paths)];
	if (uniquePaths.length !== paths.length) {
		fail("target paths must be unique");
	}
	if (
		JSON.stringify([...uniquePaths].sort()) !==
		JSON.stringify([...expectedManagedFilePaths].sort())
	) {
		fail(
			`expected exactly: ${expectedManagedFilePaths.join(", ")}; received: ${paths.join(", ")}`,
		);
	}

	for (const entry of files) {
		const targetPath = String(entry.targetPath);
		if (entry.strategy !== "combine" || entry.gitIgnored !== false) {
			fail(`${targetPath} must use combine strategy and remain tracked`);
		}
		const expectedCacheFile = `.agentops/cache/prompt-files/files/${targetPath}`;
		if (entry.cacheFile !== expectedCacheFile) {
			fail(`${targetPath} cacheFile must be ${expectedCacheFile}`);
		}

		const revisions = record(entry.revisions, `${targetPath} revisions`);
		const revisionEntries = Object.entries(revisions);
		if (
			revisionEntries.length === 0 ||
			revisionEntries.some(
				([scope, revision]) =>
					!["organization", "project"].includes(scope) ||
					!Number.isInteger(revision) ||
					Number(revision) < 1,
			)
		) {
			fail(`${targetPath} revisions must contain positive scoped revisions`);
		}

		const content = await readFile(resolve(root, targetPath));
		const localChecksum = checksum(content);
		if (entry.checksum !== localChecksum) {
			fail(
				`${targetPath} checksum mismatch: lock=${String(entry.checksum)} local=${localChecksum}`,
			);
		}
	}

	return { count: files.length, paths };
}

const isDirectRun =
	process.argv[1] &&
	import.meta.url === pathToFileURL(resolve(process.argv[1])).href;

if (isDirectRun) {
	try {
		const result = await validateAgentOpsManagedFiles();
		console.log(`AgentOps managed-file lock verified: ${result.count} files.`);
	} catch (error) {
		console.error(error instanceof Error ? error.message : String(error));
		process.exitCode = 1;
	}
}
