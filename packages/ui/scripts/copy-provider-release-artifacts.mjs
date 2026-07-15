#!/usr/bin/env node
import { cp, mkdir, rm } from "node:fs/promises";
import { resolve } from "node:path";

const packageRoot = resolve(import.meta.dirname, "..");
const registryRoot = resolve(packageRoot, "../provider-registry");
const outputRoot = resolve(packageRoot, "dist/provider-registry");

await rm(outputRoot, { force: true, recursive: true });
await mkdir(outputRoot, { recursive: true });
await Promise.all([
	cp(resolve(registryRoot, "registry"), resolve(outputRoot, "registry"), {
		recursive: true,
	}),
	cp(resolve(registryRoot, "third-party"), resolve(outputRoot, "third-party"), {
		recursive: true,
	}),
]);

console.log(
	"Copied provider provenance, SPDX SBOM, LICENSE, and NOTICE artifacts.",
);
