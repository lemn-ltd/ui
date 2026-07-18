#!/usr/bin/env node
import { writeFile } from "node:fs/promises";
import { createServer, type Server, Socket } from "node:net";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const LOOPBACK_HOST = "127.0.0.1";
const DEFAULT_TARGET_HOST = "host.docker.internal";

export interface LoopbackProxyOptions {
	listenPort: number;
	readyFile?: string;
	targetHost: string;
	targetPort: number;
}

export interface LoopbackProxy {
	close: () => Promise<void>;
	port: number;
}

function connectSockets(client: Socket, upstream: Socket): void {
	client.pipe(upstream);
	upstream.pipe(client);

	client.once("error", () => upstream.destroy());
	upstream.once("error", () => client.destroy());
	client.once("close", () => upstream.end());
	upstream.once("close", () => client.end());
}

function closeServer(server: Server, sockets: Set<Socket>): Promise<void> {
	for (const socket of sockets) socket.destroy();
	return new Promise((resolvePromise, rejectPromise) => {
		server.close((error) => {
			if (error) rejectPromise(error);
			else resolvePromise();
		});
	});
}

export async function createLinuxSnapshotLoopbackProxy(
	options: LoopbackProxyOptions,
): Promise<LoopbackProxy> {
	const sockets = new Set<Socket>();
	const server = createServer((client) => {
		const upstream = new Socket();
		sockets.add(client);
		sockets.add(upstream);
		client.once("close", () => sockets.delete(client));
		upstream.once("close", () => sockets.delete(upstream));
		connectSockets(client, upstream);
		upstream.connect(options.targetPort, options.targetHost);
	});

	await new Promise<void>((resolvePromise, rejectPromise) => {
		server.once("error", rejectPromise);
		server.listen(options.listenPort, LOOPBACK_HOST, () => {
			server.off("error", rejectPromise);
			resolvePromise();
		});
	});

	const address = server.address();
	if (!address || typeof address === "string") {
		await closeServer(server, sockets);
		throw new Error("Linux snapshot loopback proxy did not bind a TCP port");
	}

	try {
		if (options.readyFile) {
			await writeFile(options.readyFile, `${LOOPBACK_HOST}:${address.port}\n`, {
				flag: "wx",
			});
		}
	} catch (error) {
		await closeServer(server, sockets);
		throw error;
	}

	return {
		close: () => closeServer(server, sockets),
		port: address.port,
	};
}

function parsePort(rawValue: string, description: string): number {
	const port = Number(rawValue);
	if (!Number.isInteger(port) || port < 1 || port > 65_535) {
		throw new Error(`${description} must be an integer from 1 through 65535`);
	}
	return port;
}

function parseReadyFile(args: string[]): string | undefined {
	if (args.length === 0) return undefined;
	if (args.length !== 2 || args[0] !== "--ready-file" || !args[1]) {
		throw new Error("Usage: linux-snapshot-loopback-proxy [--ready-file PATH]");
	}
	return resolve(args[1]);
}

function proxyOptionsFromEnvironment(
	args: string[],
	environment: NodeJS.ProcessEnv,
): LoopbackProxyOptions {
	const rawBaseUrl = environment.PORTAL_LINUX_SNAPSHOT_BASE_URL;
	if (!rawBaseUrl) {
		throw new Error("PORTAL_LINUX_SNAPSHOT_BASE_URL is required");
	}
	const baseUrl = new URL(rawBaseUrl);
	if (
		baseUrl.protocol !== "http:" ||
		baseUrl.hostname !== LOOPBACK_HOST ||
		!baseUrl.port ||
		rawBaseUrl !== baseUrl.origin
	) {
		throw new Error(
			"PORTAL_LINUX_SNAPSHOT_BASE_URL must be an exact HTTP loopback origin",
		);
	}

	return {
		listenPort: parsePort(baseUrl.port, "Loopback proxy port"),
		readyFile: parseReadyFile(args),
		targetHost:
			environment.PORTAL_LINUX_SNAPSHOT_TARGET_HOST ?? DEFAULT_TARGET_HOST,
		targetPort: parsePort(
			environment.PORTAL_LINUX_SNAPSHOT_TARGET_PORT ?? baseUrl.port,
			"Snapshot target port",
		),
	};
}

async function main(args: string[]): Promise<void> {
	const proxy = await createLinuxSnapshotLoopbackProxy(
		proxyOptionsFromEnvironment(args, process.env),
	);
	console.log(`Linux snapshot loopback proxy listening on port ${proxy.port}`);

	await new Promise<void>((resolvePromise) => {
		const stop = (): void => {
			process.off("SIGINT", stop);
			process.off("SIGTERM", stop);
			resolvePromise();
		};
		process.on("SIGINT", stop);
		process.on("SIGTERM", stop);
	});
	await proxy.close();
}

if (
	process.argv[1] &&
	import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
	await main(process.argv.slice(2));
}
