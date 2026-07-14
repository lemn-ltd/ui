import { statfs } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

export const MINIMUM_E2E_FREE_BYTES = 4n * 1024n * 1024n * 1024n;

function gibibytes(bytes) {
	return (Number(bytes) / 1024 ** 3).toFixed(2);
}

export function assertE2eRunnerCapacity(
	availableBytes,
	minimumBytes = MINIMUM_E2E_FREE_BYTES,
) {
	if (availableBytes < minimumBytes) {
		throw new Error(
			`E2E runner disk preflight failed: ${gibibytes(availableBytes)} GiB available; ${gibibytes(minimumBytes)} GiB required for Chromium, Vite transforms, and Playwright artifacts.`,
		);
	}

	return {
		availableBytes,
		minimumBytes,
	};
}

export async function checkE2eRunnerCapacity(targetPath = process.cwd()) {
	const stats = await statfs(targetPath, { bigint: true });
	const result = assertE2eRunnerCapacity(stats.bavail * stats.bsize);
	console.log(
		`E2E runner disk preflight passed: ${gibibytes(result.availableBytes)} GiB available.`,
	);
	return result;
}

const isMain =
	process.argv[1] &&
	import.meta.url === pathToFileURL(resolve(process.argv[1])).href;

if (isMain) {
	await checkE2eRunnerCapacity(resolve(process.argv[2] ?? process.cwd()));
}
