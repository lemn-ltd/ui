import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";

const root = resolve(import.meta.dirname, "../..");
const authRecipe = [
	"//npm.pkg.github.com/:_authToken=$",
	"{NODE_AUTH_TOKEN}",
].join("");

async function run(
	command: string,
	args: string[],
	cwd: string,
	env: NodeJS.ProcessEnv,
): Promise<void> {
	await new Promise<void>((resolveProcess, rejectProcess) => {
		const child = spawn(command, args, { cwd, env, stdio: "ignore" });
		const timeout = setTimeout(() => child.kill("SIGKILL"), 15_000);
		child.once("error", rejectProcess);
		child.once("exit", (code) => {
			clearTimeout(timeout);
			if (code === 0) resolveProcess();
			else
				rejectProcess(
					new Error(`${command} exited with ${code ?? "no status"}`),
				);
		});
	});
}

test("published EN/ES docs require a user-level npm auth entry without storing a token", async () => {
	const paths = [
		"README.md",
		"packages/ui/README.md",
		"apps/docs/src/content/docs/getting-started/index.mdx",
		"apps/docs/src/content/docs/es/getting-started/index.mdx",
	];
	for (const path of paths) {
		const content = await readFile(resolve(root, path), "utf8");
		assert.match(
			content,
			/~\/\.npmrc/u,
			`${path} must identify the user-level npmrc`,
		);
		assert.ok(
			content.includes(authRecipe),
			`${path} must include the environment-backed auth entry`,
		);
	}

	const repositoryNpmrc = await readFile(resolve(root, ".npmrc"), "utf8");
	assert.doesNotMatch(repositoryNpmrc, /_authToken|NODE_AUTH_TOKEN/u);
});

test("pnpm 11 sends the user npmrc token to the configured private scope registry", async () => {
	let authorization: string | undefined;
	const server = createServer((request, response) => {
		authorization = request.headers.authorization;
		response.setHeader("content-type", "application/json");
		response.end(
			JSON.stringify({
				name: "@lemn-ltd/ui",
				"dist-tags": { latest: "0.1.2" },
				versions: { "0.1.2": { name: "@lemn-ltd/ui", version: "0.1.2" } },
			}),
		);
	});
	await new Promise<void>((resolveListen) =>
		server.listen(0, "127.0.0.1", resolveListen),
	);
	const address = server.address();
	assert.ok(address && typeof address === "object");

	const fixtureToken = "contract-fixture-token";
	const directory = await mkdtemp(join(tmpdir(), "lemn-private-package-auth-"));
	const userConfig = join(directory, "user.npmrc");
	try {
		const registry = `http://127.0.0.1:${address.port}`;
		await writeFile(
			join(directory, "package.json"),
			'{"name":"auth-contract","private":true}\n',
		);
		await writeFile(
			join(directory, ".npmrc"),
			`@lemn-ltd:registry=${registry}\n`,
		);
		await writeFile(
			userConfig,
			`//127.0.0.1:${address.port}/:_authToken=\${NODE_AUTH_TOKEN}\n`,
		);

		await run(
			"pnpm",
			["view", "@lemn-ltd/ui@0.1.2", "version", "--json"],
			directory,
			{
				...process.env,
				NODE_AUTH_TOKEN: fixtureToken,
				NPM_CONFIG_USERCONFIG: userConfig,
			},
		);
		assert.equal(authorization, `Bearer ${fixtureToken}`);
	} finally {
		server.close();
		await rm(directory, { recursive: true, force: true });
	}
});
