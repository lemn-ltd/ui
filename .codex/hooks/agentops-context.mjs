#!/usr/bin/env node
import { execFile } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import process from "node:process";

const DEFAULT_MCP_URL = "https://agentops.le-mn.com/mcp";
const DEFAULT_MCP_PROTOCOL_VERSION = "2025-11-25";
const STATE_PATH = ".agentops/state.json";
const PROJECT_MANIFEST_PATH = ".agentops/project.json";
const DIFFS_DIR = ".agentops/diffs";
const DEFAULT_MAX_CONTEXT_CHARS = 512000;
const DEFAULT_INLINE_DIFF_CHARS = 24000;

async function main() {
  const hookInput = await readHookInput();
  const hookEventName = String(hookInput.hook_event_name ?? hookInput.hookEventName ?? "");
  const root = await findAgentOpsRoot(process.cwd());
  if (!root) return;

  const projectManifest = await readJson(path.join(root, PROJECT_MANIFEST_PATH));
  const token = await readProjectToken(root, projectManifest);
  if (!token) return;

  const mcpUrl = String(projectManifest.mcp?.url || process.env.AGENTOPS_MCP_SERVER_URL || DEFAULT_MCP_URL);
  const protocolVersion = String(projectManifest.mcp?.protocolVersion || DEFAULT_MCP_PROTOCOL_VERSION);
  const client = mcpClient({ mcpUrl, token, protocolVersion });

  const [managedFilesResult, projectToolingResult] = await Promise.all([
    safeMcpTool(client, "list_managed_files", {}),
    safeMcpTool(client, "list_project_tooling", {
      project_id: projectManifest.project?.id,
      environment: projectManifest.environments?.default,
    }),
  ]);

  if (!managedFilesResult) return;

  const managedFiles = normalizeManagedFiles(managedFilesResult.files);
  const projectTooling = normalizeProjectTooling(projectToolingResult);
  const state = await readState(root);
  const previousFiles = Array.isArray(state.agentopsHookContext?.files)
    ? state.agentopsHookContext.files
    : [];
  const changedManagedFiles = changedManagedFilesSincePrevious(managedFiles, previousFiles);
  const removedManagedFiles = removedManagedFilesSincePrevious(managedFiles, previousFiles);
  const runId = hookRunId();
  const materialization = await materializeManagedFiles(
    root,
    managedFiles,
    previousFiles,
    runId,
  );
  const signature = checksum(JSON.stringify({
    managedFiles: managedFiles.map((file) => ({
      targetPath: file.targetPath,
      checksum: file.checksum,
      revisions: file.revisions,
    })),
    tooling: projectTooling.signature,
  }));

  const previousToolingSignature = state.agentopsHookContext?.toolingSignature ?? null;
  const toolingChanged = projectTooling.available && projectTooling.signature !== previousToolingSignature;
  const forceContext = process.argv.includes("--force-context");
  const filesToInject = forceContext ? managedFiles : changedManagedFiles;
  const shouldInject =
    forceContext ||
    filesToInject.length > 0 ||
    removedManagedFiles.length > 0 ||
    toolingChanged;
  const changeSet = buildChangeSet({
    runId,
    materialization,
    injectedFiles: filesToInject,
    removedManagedFiles,
  });

  await writeState(root, {
    ...state,
    agentopsHookContext: {
      signature,
      checkedAt: new Date().toISOString(),
      projectId: projectManifest.project?.id ?? managedFilesResult.projectId,
      environment: projectManifest.environments?.default ?? managedFilesResult.environment,
      files: managedFiles.map((file) => ({
        targetPath: file.targetPath,
        checksum: file.checksum,
        revisions: file.revisions,
      })),
      materialization: summarizeMaterialization(materialization),
      changeSet,
      tooling: projectTooling.state,
      toolingSignature: projectTooling.signature,
    },
  });

  if (!shouldInject) return;

  const context = limitContext(renderContext({
    projectManifest,
    managedFiles: filesToInject,
    removedManagedFiles,
    projectTooling,
    source: {
      managedFiles: "MCP tools/call:list_managed_files",
      tooling: projectTooling.available ? "MCP tools/call:list_project_tooling" : "not_available",
    },
  }));

  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName,
      additionalContext: context,
    },
  }));
}

async function readHookInput() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8").trim();
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

async function findAgentOpsRoot(start) {
  let current = path.resolve(start);
  while (true) {
    const manifestPath = path.join(current, PROJECT_MANIFEST_PATH);
    if (await exists(manifestPath)) return current;
    const parent = path.dirname(current);
    if (parent === current) return null;
    current = parent;
  }
}

async function readProjectToken(root, projectManifest) {
  const tokenEnvVar = String(projectManifest.mcp?.tokenEnvVar || "AGENTOPS_MCP_TOKEN");
  const env = await readDotEnv(path.join(root, ".env"));
  const localToken = env[tokenEnvVar]?.trim();
  if (localToken) return localToken;
  if (process.env.AGENTOPS_HOOK_ALLOW_PROCESS_ENV === "1") {
    return process.env[tokenEnvVar]?.trim();
  }
  return "";
}

async function readDotEnv(filePath) {
  const content = await fs.readFile(filePath, "utf8").catch(() => "");
  const env = {};
  for (const line of content.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (!match) continue;
    env[match[1]] = match[2].replace(/^['"]|['"]$/g, "");
  }
  return env;
}

function mcpClient({ mcpUrl, token, protocolVersion }) {
  return async function callTool(name, args) {
    const url = new URL(mcpUrl);
    url.searchParams.set("cb", `${Date.now()}-${crypto.randomBytes(6).toString("hex")}`);
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json, text/event-stream",
        authorization: `Bearer ${token}`,
        "MCP-Protocol-Version": protocolVersion,
        "Cache-Control": "no-cache, no-store, max-age=0",
        Pragma: "no-cache",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        method: "tools/call",
        params: { name, arguments: args },
      }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.error) {
      throw new Error(data.error?.message || data.error?.data?.code || `AgentOps MCP failed with ${response.status}`);
    }
    if (data.result?.structuredContent && typeof data.result.structuredContent === "object") {
      return data.result.structuredContent;
    }
    const text = data.result?.content?.find?.((item) => item?.type === "text")?.text;
    if (typeof text === "string") return JSON.parse(text);
    throw new Error("AgentOps MCP response did not include structured content");
  };
}

async function safeMcpTool(client, name, args) {
  try {
    return await client(name, args);
  } catch {
    return null;
  }
}

function changedManagedFilesSincePrevious(managedFiles, previousFiles) {
  const previousByTarget = new Map(
    previousFiles
      .filter((file) => file?.targetPath)
      .map((file) => [file.targetPath, file]),
  );
  return managedFiles
    .filter((file) => managedFileChanged(file, previousByTarget.get(file.targetPath)))
    .sort(compareManagedFiles);
}

function removedManagedFilesSincePrevious(managedFiles, previousFiles) {
  const currentTargets = new Set(managedFiles.map((file) => file.targetPath));
  return previousFiles
    .filter((file) => file?.targetPath && !currentTargets.has(file.targetPath))
    .map((file) => ({
      targetPath: file.targetPath,
      checksum: file.checksum,
      revisions: file.revisions || {},
    }))
    .sort(compareManagedFiles);
}

function managedFileChanged(current, previous) {
  if (!previous) return true;
  return current.checksum !== previous.checksum ||
    checksum(JSON.stringify(current.revisions || {})) !== checksum(JSON.stringify(previous.revisions || {}));
}

function compareManagedFiles(a, b) {
  const priority = managedFilePriority(a.targetPath) - managedFilePriority(b.targetPath);
  if (priority !== 0) return priority;
  return a.targetPath.localeCompare(b.targetPath);
}

function managedFilePriority(targetPath) {
  if (targetPath === "AGENTS.md") return 0;
  if (targetPath.endsWith("/AGENTS.md")) return 1;
  return 2;
}

async function materializeManagedFiles(root, managedFiles, previousFiles = [], runId) {
  const currentTargets = new Set(managedFiles.map((file) => file.targetPath));
  const files = [];
  for (const file of managedFiles) {
    files.push(await materializeManagedFile(root, file, runId));
  }

  const removed = [];
  const previousTargets = Array.isArray(previousFiles)
    ? previousFiles.map((file) => file?.targetPath).filter(Boolean)
    : [];
  for (const targetPath of previousTargets) {
    if (!currentTargets.has(targetPath)) {
      removed.push(await removeManagedFile(root, targetPath, runId));
    }
  }

  return {
    mode: "remote_wins",
    materializedAt: new Date().toISOString(),
    files,
    removed,
  };
}

async function materializeManagedFile(root, file, runId) {
  try {
    const targetPath = normalizeTargetPath(file.targetPath);
    const target = resolveInsideRoot(root, targetPath);
    const desired = normalizeContent(file.content);
    const current = await readLocalManagedFile(target);
    if (current !== null && normalizeContent(current) === desired) {
      return materializedFileResult(file, "unchanged");
    }

    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, desired, "utf8");
    const status = current === null ? "created" : "updated";
    const diff = await managedFileDiff(root, runId, targetPath, current ?? "", desired, status);
    return materializedFileResult(file, status, undefined, {
      previousChecksum: current === null ? null : checksum(current),
      diff,
    });
  } catch (error) {
    return materializedFileResult(file, "failed", error);
  }
}

async function readLocalManagedFile(target) {
  try {
    const stat = await fs.lstat(target);
    if (stat.isSymbolicLink()) {
      throw new Error("Refusing to overwrite symbolic link");
    }
    if (!stat.isFile()) {
      throw new Error("Refusing to overwrite non-file path");
    }
    return await fs.readFile(target, "utf8");
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    throw error;
  }
}

async function removeManagedFile(root, targetPath, runId) {
  const normalized = normalizeTargetPath(targetPath);
  try {
    const target = resolveInsideRoot(root, normalized);
    const stat = await fs.lstat(target);
    if (!stat.isFile() && !stat.isSymbolicLink()) {
      throw new Error("Refusing to remove non-file path");
    }
    const current = stat.isFile() ? await fs.readFile(target, "utf8") : "";
    await fs.unlink(target);
    return {
      targetPath: normalized,
      status: "removed",
      previousChecksum: current ? checksum(current) : null,
      diff: await managedFileDiff(root, runId, normalized, current, "", "removed"),
    };
  } catch (error) {
    if (error?.code === "ENOENT") {
      return { targetPath: normalized, status: "missing" };
    }
    return {
      targetPath: normalized,
      status: "failed",
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function materializedFileResult(file, status, error, extra = {}) {
  return {
    targetPath: file.targetPath,
    checksum: file.checksum,
    revisions: file.revisions,
    status,
    ...extra,
    ...(error ? { error: error instanceof Error ? error.message : String(error) } : {}),
  };
}

function buildChangeSet({ runId, materialization, injectedFiles, removedManagedFiles }) {
  const changedFiles = materialization.files.filter((file) => file.status !== "unchanged");
  const removedFiles = materialization.removed.filter((file) => file.status !== "missing");
  return {
    runId,
    changedAt: materialization.materializedAt,
    mode: materialization.mode,
    summary: {
      changedFiles: changedFiles.length,
      removedFiles: removedFiles.length,
      injectedFiles: injectedFiles.length,
      injectedRemovedFiles: removedManagedFiles.length,
    },
    injected: {
      files: injectedFiles.map((file) => ({
        targetPath: file.targetPath,
        checksum: file.checksum,
        revisions: file.revisions,
      })),
      removed: removedManagedFiles,
    },
    files: changedFiles,
    removed: removedFiles,
  };
}

function summarizeMaterialization(materialization) {
  return {
    mode: materialization.mode,
    materializedAt: materialization.materializedAt,
    files: materialization.files.map((file) => {
      const { diff: _diff, ...summary } = file;
      return summary;
    }),
    removed: materialization.removed.map((file) => {
      const { diff: _diff, ...summary } = file;
      return summary;
    }),
  };
}

async function managedFileDiff(root, runId, targetPath, before, after, status) {
  const normalizedBefore = normalizeContent(before);
  const normalizedAfter = normalizeContent(after);
  if (normalizedBefore === normalizedAfter) return null;

  const diffText = await unifiedDiff(targetPath, normalizedBefore, normalizedAfter).catch((error) =>
    fallbackDiff(targetPath, normalizedBefore, normalizedAfter, error),
  );
  const diffBytes = Buffer.byteLength(diffText, "utf8");
  const inlineLimit = inlineDiffLimit();
  const lineStats = {
    beforeLines: countLines(normalizedBefore),
    afterLines: countLines(normalizedAfter),
  };

  if (diffText.length <= inlineLimit) {
    return {
      format: "unified",
      status,
      truncated: false,
      bytes: diffBytes,
      ...lineStats,
      inline: diffText,
    };
  }

  const diffPath = path.join(DIFFS_DIR, runId, `${safeDiffFileName(targetPath)}.diff`);
  const absoluteDiffPath = resolveInsideRoot(root, diffPath);
  await fs.mkdir(path.dirname(absoluteDiffPath), { recursive: true });
  await fs.writeFile(absoluteDiffPath, diffText, "utf8");
  return {
    format: "unified",
    status,
    truncated: true,
    bytes: diffBytes,
    ...lineStats,
    inlinePreview: `${diffText.slice(0, inlineLimit)}\n\n[Full AgentOps managed-file diff written to ${diffPath}]`,
    diffPath,
  };
}

async function unifiedDiff(targetPath, before, after) {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "agentops-managed-diff-"));
  const beforePath = path.join(tempRoot, "before");
  const afterPath = path.join(tempRoot, "after");
  await fs.writeFile(beforePath, before, "utf8");
  await fs.writeFile(afterPath, after, "utf8");
  try {
    const { stdout } = await execFileAsync("git", [
      "diff",
      "--no-index",
      "--no-color",
      "--unified=3",
      "--",
      beforePath,
      afterPath,
    ]);
    return normalizeDiffHeader(stdout, targetPath);
  } catch (error) {
    if (typeof error?.stdout === "string" && error.stdout) {
      return normalizeDiffHeader(error.stdout, targetPath);
    }
    throw error;
  } finally {
    await fs.rm(tempRoot, { recursive: true, force: true }).catch(() => undefined);
  }
}

function normalizeDiffHeader(diffText, targetPath) {
  const lines = normalizeContent(diffText).split("\n");
  const normalized = [];
  for (const line of lines) {
    if (line.startsWith("diff --git ")) {
      normalized.push(`diff --git a/${targetPath} b/${targetPath}`);
    } else if (line.startsWith("--- ")) {
      normalized.push(`--- a/${targetPath}`);
    } else if (line.startsWith("+++ ")) {
      normalized.push(`+++ b/${targetPath}`);
    } else if (line.startsWith("index ")) {
      normalized.push(line);
    } else {
      normalized.push(line);
    }
  }
  return normalized.join("\n").trimEnd();
}

function fallbackDiff(targetPath, before, after, error) {
  return [
    `diff --git a/${targetPath} b/${targetPath}`,
    `--- a/${targetPath}`,
    `+++ b/${targetPath}`,
    "@@ AgentOps fallback diff @@",
    `[Unified diff unavailable: ${error instanceof Error ? error.message : String(error)}]`,
    `Before checksum: ${checksum(before)}`,
    `After checksum: ${checksum(after)}`,
  ].join("\n");
}

function execFileAsync(command, args) {
  return new Promise((resolve, reject) => {
    execFile(command, args, { maxBuffer: 32 * 1024 * 1024 }, (error, stdout, stderr) => {
      if (error) {
        error.stdout = stdout;
        error.stderr = stderr;
        reject(error);
        return;
      }
      resolve({ stdout, stderr });
    });
  });
}

function inlineDiffLimit() {
  const value = Number(process.env.AGENTOPS_HOOK_INLINE_DIFF_CHARS || DEFAULT_INLINE_DIFF_CHARS);
  return Number.isFinite(value) && value > 0 ? value : DEFAULT_INLINE_DIFF_CHARS;
}

function hookRunId() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  return `${timestamp}-${crypto.randomBytes(4).toString("hex")}`;
}

function safeDiffFileName(targetPath) {
  const safe = targetPath.replace(/[^A-Za-z0-9._-]+/g, "__").replace(/^_+|_+$/g, "");
  return `${safe || "managed-file"}-${checksum(targetPath).slice("sha256:".length, "sha256:".length + 12)}`;
}

function countLines(value) {
  if (!value) return 0;
  return value.endsWith("\n") ? value.split("\n").length - 1 : value.split("\n").length;
}

function normalizeManagedFiles(files) {
  return (Array.isArray(files) ? files : [])
    .map((file) => {
      const content = normalizeContent(file.content ?? "");
      return {
        targetPath: normalizeTargetPath(file.target_path),
        content,
        checksum: file.checksum || checksum(content),
        revisions: file.revisions || {},
        mergeMode: file.merge_mode,
        gitIgnored: Boolean(file.git_ignored),
      };
    })
    .sort(compareManagedFiles);
}

function normalizeProjectTooling(value) {
  if (!value || typeof value !== "object") {
    return {
      available: false,
      signature: null,
      state: { available: false },
      mcpServers: [],
      cliTools: [],
    };
  }
  const mcpServers = Array.isArray(value.mcpServers) ? value.mcpServers : [];
  const cliTools = Array.isArray(value.clis) ? value.clis : Array.isArray(value.cliTools) ? value.cliTools : [];
  const state = {
    available: true,
    mcpServers: mcpServers.map((item) => toolingSummary(item, "mcp")),
    cliTools: cliTools.map((item) => toolingSummary(item, "cli")),
  };
  return {
    available: true,
    signature: checksum(JSON.stringify(state)),
    state,
    mcpServers,
    cliTools,
  };
}

function toolingSummary(item, kind) {
  const entity = kind === "mcp" ? item.server ?? item.mcpServer ?? item : item.tool ?? item.cliTool ?? item;
  return {
    id: entity?.id ?? item.id,
    name: entity?.name ?? item.name,
    status: entity?.status ?? item.status,
    enabled: item.enabled,
  };
}

function renderContext({ projectManifest, managedFiles, removedManagedFiles, projectTooling, source }) {
  const projectName = projectManifest.project?.name || projectManifest.project?.id || "unknown";
  const environment = projectManifest.environments?.default || "development";
  const parts = [
    "# AgentOps Remote Context",
    "",
    "These project instructions and tooling definitions were loaded from AgentOps using the current project's MCP token. Treat this remote context as the current AgentOps-managed project context for this turn. Do not print or expose the token.",
    "",
    `Project: ${projectName}`,
    `Environment: ${environment}`,
    `Managed files source: ${source.managedFiles}`,
    `Tooling source: ${source.tooling}`,
    "",
    "Only AgentOps managed files that changed since the last local hook state are included below. All effective managed files were still materialized to disk before this context was emitted.",
    "",
    "## Changed Managed Files",
    "",
    ...(managedFiles.length ? managedFiles.flatMap((file) => [
      `### ${file.targetPath}`,
      "",
      `Checksum: ${file.checksum}`,
      `Revisions: ${JSON.stringify(file.revisions)}`,
      "",
      "```",
      file.content.trimEnd(),
      "```",
      "",
    ]) : ["No managed file content changed.", ""]),
  ];

  if (removedManagedFiles.length) {
    parts.push("## Removed Managed Files", "");
    for (const file of removedManagedFiles) {
      parts.push(`- ${file.targetPath}`, `  Previous checksum: ${file.checksum}`, "");
    }
  }

  if (projectTooling.available) {
    parts.push("## Project Tooling", "");
    parts.push("### MCP Servers", "");
    parts.push(JSON.stringify(projectTooling.mcpServers, redactedJsonReplacer, 2), "");
    parts.push("### CLI Tools", "");
    parts.push(JSON.stringify(projectTooling.cliTools, redactedJsonReplacer, 2), "");
  }

  return parts.join("\n");
}

function redactedJsonReplacer(key, value) {
  if (/token|secret|password|credential|authorization/i.test(key)) return "[redacted]";
  return value;
}

function limitContext(context) {
  const limit = Number(process.env.AGENTOPS_HOOK_MAX_CONTEXT_CHARS || DEFAULT_MAX_CONTEXT_CHARS);
  if (!Number.isFinite(limit) || limit <= 0 || context.length <= limit) return context;
  return `${context.slice(0, limit)}\n\n[AgentOps remote context truncated at ${limit} characters]`;
}

async function readState(root) {
  const parsed = await readJsonOptional(path.join(root, STATE_PATH));
  return parsed && typeof parsed === "object" ? parsed : {};
}

async function writeState(root, state) {
  const statePath = path.join(root, STATE_PATH);
  await fs.mkdir(path.dirname(statePath), { recursive: true });
  await fs.writeFile(statePath, `${JSON.stringify(state, null, 2)}\n`, "utf8");
}

async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, "utf8"));
}

async function readJsonOptional(filePath) {
  const content = await fs.readFile(filePath, "utf8").catch(() => null);
  return content ? JSON.parse(content) : null;
}

async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function resolveInsideRoot(root, targetPath) {
  const resolvedRoot = path.resolve(root);
  const resolvedTarget = path.resolve(resolvedRoot, normalizeTargetPath(targetPath));
  const relative = path.relative(resolvedRoot, resolvedTarget);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error("Managed file path escapes project root");
  }
  return resolvedTarget;
}

function normalizeTargetPath(value) {
  const normalized = String(value).trim().replace(/\\/g, "/");
  if (!normalized || normalized.startsWith("/") || normalized.startsWith("~") || normalized.includes("\0")) {
    throw new Error("Unsafe managed file path");
  }
  const segments = normalized.split("/");
  if (segments.some((segment) => !segment || segment === "." || segment === "..") || segments.includes(".git")) {
    throw new Error("Unsafe managed file path");
  }
  return segments.join("/");
}

function normalizeContent(value) {
  return String(value).replace(/\r\n?/g, "\n");
}

function checksum(value) {
  return `sha256:${crypto.createHash("sha256").update(normalizeContent(value)).digest("hex")}`;
}

main().catch(() => {
  process.exit(0);
});
