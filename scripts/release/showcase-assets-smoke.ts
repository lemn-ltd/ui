#!/usr/bin/env node

import { type ChildProcess, spawn } from "node:child_process";
import { once } from "node:events";
import { access, readFile } from "node:fs/promises";
import { createServer } from "node:net";
import { resolve, sep } from "node:path";

const STARTUP_TIMEOUT_MS = 30_000;

function assert(condition: unknown, message: string): asserts condition {
	if (!condition) throw new Error(message);
}

async function exists(path: string): Promise<boolean> {
	try {
		await access(path);
		return true;
	} catch {
		return false;
	}
}

function assetPathFromHtml(html: string): string {
	const matches = html.matchAll(/(?:src|href)=["'](\/assets\/[^"']+)["']/gu);
	const assetPath = matches.next().value?.[1];
	assert(assetPath, "Showcase index.html does not reference a built asset");
	return assetPath;
}

export async function assertShowcaseAssetLayout(showcaseRoot: string): Promise<{
	assetPath: string;
	clientRoot: string;
}> {
	const clientRoot = resolve(showcaseRoot, "dist/client");
	assert(
		!(await exists(resolve(clientRoot, "client"))),
		"Showcase assets are nested under dist/client/client",
	);

	const indexPath = resolve(clientRoot, "index.html");
	assert(
		await exists(indexPath),
		"Showcase index.html must exist directly under dist/client",
	);
	const assetPath = assetPathFromHtml(await readFile(indexPath, "utf8"));
	const assetFile = resolve(clientRoot, `.${assetPath}`);
	assert(
		assetFile.startsWith(`${clientRoot}${sep}`),
		"Showcase index.html references an asset outside dist/client",
	);
	assert(
		await exists(assetFile),
		`Showcase index.html references missing asset ${assetPath}`,
	);

	return { assetPath, clientRoot };
}

async function availablePort(): Promise<number> {
	const server = createServer();
	server.listen(0, "127.0.0.1");
	await once(server, "listening");
	const address = server.address();
	assert(
		address && typeof address === "object",
		"Could not reserve a local port",
	);
	const port = address.port;
	server.close();
	await once(server, "close");
	return port;
}

function sanitizedEnvironment(): NodeJS.ProcessEnv {
	const environment = { ...process.env };
	for (const name of [
		"CLOUDFLARE_ACCOUNT_ID",
		"CLOUDFLARE_API_KEY",
		"CLOUDFLARE_API_TOKEN",
		"CLOUDFLARE_EMAIL",
	]) {
		delete environment[name];
	}
	return environment;
}

function stopProcess(child: ChildProcess): void {
	if (!child.pid || child.exitCode !== null) return;
	try {
		process.kill(-child.pid, "SIGTERM");
	} catch {
		child.kill("SIGTERM");
	}
}

export function wranglerLocalArguments(port: number): string[] {
	return [
		"--dir",
		"apps/showcase",
		"exec",
		"wrangler",
		"dev",
		"--config",
		"wrangler.jsonc",
		"--env",
		"production",
		"--local",
		"--ip",
		"127.0.0.1",
		"--port",
		String(port),
		"--var",
		"BUILD_VERSION:asset-smoke",
		"--var",
		"BUILD_GIT_SHA:asset-smoke",
		"--var",
		"BUILD_TIME:2026-07-14T00:00:00Z",
	];
}

async function waitForHealth(
	origin: string,
	child: ChildProcess,
	output: () => string,
): Promise<void> {
	const deadline = Date.now() + STARTUP_TIMEOUT_MS;
	while (Date.now() < deadline) {
		if (child.exitCode !== null) {
			throw new Error(
				`Wrangler exited before local smoke was ready\n${output()}`,
			);
		}
		try {
			const response = await fetch(`${origin}/health`);
			if (response.status === 200) return;
		} catch {
			// Wrangler has not started listening yet.
		}
		await new Promise((resolveDelay) => setTimeout(resolveDelay, 250));
	}
	throw new Error(`Wrangler did not become ready within 30s\n${output()}`);
}

async function main(): Promise<void> {
	const root = resolve(import.meta.dirname, "../..");
	const showcaseRoot = resolve(root, "apps/showcase");
	const layout = await assertShowcaseAssetLayout(showcaseRoot);
	const port = await availablePort();
	const origin = `http://127.0.0.1:${port}`;
	const output: string[] = [];
	const child = spawn("pnpm", wranglerLocalArguments(port), {
		cwd: root,
		detached: true,
		env: sanitizedEnvironment(),
		stdio: ["ignore", "pipe", "pipe"],
	});
	const capture = (chunk: Buffer): void => {
		output.push(chunk.toString());
		if (output.length > 100) output.shift();
	};
	child.stdout?.on("data", capture);
	child.stderr?.on("data", capture);

	try {
		await waitForHealth(origin, child, () => output.join(""));
		const home = await fetch(`${origin}/`);
		assert(home.status === 200, `Showcase home returned HTTP ${home.status}`);
		const html = await home.text();
		assert(html.includes('id="root"'), "Showcase home is not the built SPA");
		const servedAssetPath = assetPathFromHtml(html);
		assert(
			servedAssetPath === layout.assetPath,
			"Wrangler served an unexpected showcase asset path",
		);
		const asset = await fetch(`${origin}${servedAssetPath}`);
		assert(
			asset.status === 200,
			`Showcase asset returned HTTP ${asset.status}`,
		);
		assert(
			(await asset.arrayBuffer()).byteLength > 0,
			"Showcase asset is empty",
		);
		console.log(
			"Showcase Wrangler smoke passed: health=200 home=200 asset=200",
		);
	} finally {
		stopProcess(child);
		await Promise.race([
			once(child, "exit"),
			new Promise((resolveDelay) => setTimeout(resolveDelay, 5_000)),
		]);
		if (child.exitCode === null && child.pid) {
			try {
				process.kill(-child.pid, "SIGKILL");
			} catch {
				child.kill("SIGKILL");
			}
		}
	}
}

if (import.meta.url === `file://${process.argv[1]}`) {
	await main();
}
