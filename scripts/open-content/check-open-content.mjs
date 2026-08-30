import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, readdir, readlink, rm, symlink, unlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { createServer } from "node:net";

import {
  compileExternalDocument,
  discoverLcmDocuments,
  inspectExternalProject,
  resolveProjectResource,
  routePathForResource,
} from "./project.mjs";

const repositoryRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "lct external content "));
const projectRoot = path.join(temporaryRoot, "project with spaces");
const outsideFile = path.join(temporaryRoot, "outside.mp3");

function lcm(title, resource = "") {
  return `---
specVersion: "0.5-draft"
title: "${title}"
documentType: "conversation"
defaultLanguageId: "test"
defaultFormId: "surface"
${resource}---

# Section
>speaker: Hello
`;
}

function runLauncher(args) {
  return spawnSync("./scripts/open-content.sh", args, {
    cwd: repositoryRoot,
    encoding: "utf8",
    env: { ...process.env, LCT_OPEN_CONTENT_VALIDATE_ONLY: "1" },
  });
}

async function availablePort() {
  const server = createServer();
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  const port = typeof address === "object" && address ? address.port : undefined;
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  if (!port) throw new Error("Could not reserve an integration-test port");
  return port;
}

async function waitForResponse(url, child, output) {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    if (child.exitCode != null) throw new Error(`Viewer exited before becoming ready\n${output()}`);
    try {
      const response = await fetch(url);
      if (response.ok) return response;
    } catch {
      // The development server is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Timed out waiting for ${url}\n${output()}`);
}

async function snapshotProject(root) {
  const snapshot = [];
  async function walk(directory, relativeDirectory = "") {
    const entries = await readdir(directory, { withFileTypes: true });
    entries.sort((left, right) => left.name.localeCompare(right.name, "en"));
    for (const entry of entries) {
      const relativePath = relativeDirectory ? `${relativeDirectory}/${entry.name}` : entry.name;
      const absolutePath = path.join(directory, entry.name);
      if (entry.isDirectory()) await walk(absolutePath, relativePath);
      else if (entry.isSymbolicLink()) snapshot.push([relativePath, "link", await readlink(absolutePath)]);
      else snapshot.push([relativePath, "file", (await readFile(absolutePath)).toString("base64")]);
    }
  }
  await walk(root);
  return snapshot;
}

await mkdir(path.join(projectRoot, "one"), { recursive: true });
await mkdir(path.join(projectRoot, "two"), { recursive: true });
await mkdir(path.join(projectRoot, ".hidden"), { recursive: true });
await mkdir(path.join(projectRoot, "node_modules", "package"), { recursive: true });
await mkdir(path.join(projectRoot, "dist"), { recursive: true });
await mkdir(path.join(projectRoot, "media"), { recursive: true });
await writeFile(path.join(projectRoot, "one", "lesson.lcm"), lcm("First lesson"));
await writeFile(path.join(projectRoot, "two", "lesson.lcm"), lcm("Second lesson"));
await writeFile(path.join(projectRoot, ".hidden", "ignored.lcm"), lcm("Hidden"));
await writeFile(path.join(projectRoot, "node_modules", "package", "ignored.lcm"), lcm("Dependency"));
await writeFile(path.join(projectRoot, "dist", "ignored.lcm"), lcm("Generated"));
await writeFile(path.join(projectRoot, "media", "sample audio.mp3"), "test audio");
await writeFile(outsideFile, "outside");

assert.deepEqual(await discoverLcmDocuments(projectRoot), ["one/lesson.lcm", "two/lesson.lcm"]);
const inspected = await inspectExternalProject(projectRoot);
assert.deepEqual(inspected.map((entry) => entry.relativePath), ["one/lesson.lcm", "two/lesson.lcm"]);
assert.notEqual(inspected[0].href, inspected[1].href, "same basenames in different folders must have distinct routes");

const noArgument = runLauncher([]);
assert.notEqual(noArgument.status, 0);
assert.match(noArgument.stderr, /missing project folder/);
assert.match(noArgument.stderr, /Usage:/);

const tooManyArguments = runLauncher([projectRoot, projectRoot]);
assert.notEqual(tooManyArguments.status, 0);
assert.match(tooManyArguments.stderr, /exactly one project folder/);

const missingFolder = runLauncher([path.join(temporaryRoot, "missing")]);
assert.notEqual(missingFolder.status, 0);
assert.match(missingFolder.stderr, /does not exist/);

const fileAsFolder = runLauncher([path.join(projectRoot, "one", "lesson.lcm")]);
assert.notEqual(fileAsFolder.status, 0);
assert.match(fileAsFolder.stderr, /not a directory/);

const absolutePath = runLauncher([projectRoot]);
assert.equal(absolutePath.status, 0, absolutePath.stderr);
assert.match(absolutePath.stdout, /LCM documents: 2/);

const relativePath = runLauncher([path.relative(repositoryRoot, projectRoot)]);
assert.equal(relativePath.status, 0, relativePath.stderr);
assert.match(relativePath.stdout, /one\/lesson\.lcm/);

const resourceBlock = `
resources:
  - id: "audio"
    type: "media"
    mediaType: "audio"
    src: "media/sample audio.mp3"
`;
const reloadPath = path.join(projectRoot, "reload.lcm");
await writeFile(reloadPath, lcm("Before reload", resourceBlock));
const beforeReload = await compileExternalDocument(projectRoot, "reload.lcm");
assert.equal(beforeReload.metadata.title, "Before reload");
assert.equal(beforeReload.resources?.[0].src, "/open-content/resources/media/sample%20audio.mp3");
assert.equal(routePathForResource("media/sample audio.mp3"), beforeReload.resources?.[0].src);

await writeFile(reloadPath, lcm("After reload", resourceBlock));
const afterReload = await compileExternalDocument(projectRoot, "reload.lcm");
assert.equal(afterReload.metadata.title, "After reload");

await assert.rejects(resolveProjectResource(projectRoot, "../outside.mp3"), /invalid path segment/);
await symlink(outsideFile, path.join(projectRoot, "media", "outside-link.mp3"));
await assert.rejects(resolveProjectResource(projectRoot, "media/outside-link.mp3"), /outside the external project root/);

const invalidPath = path.join(projectRoot, "invalid.lcm");
await writeFile(invalidPath, "not front matter");
await assert.rejects(
  compileExternalDocument(projectRoot, "invalid.lcm"),
  (error) => error instanceof Error && error.message.includes("invalid.lcm") && error.message.includes("expected front matter"),
);
const invalidProject = runLauncher([projectRoot]);
assert.notEqual(invalidProject.status, 0);
assert.match(invalidProject.stderr, /invalid\.lcm/);
assert.match(invalidProject.stderr, /expected front matter/);
await unlink(invalidPath);

const statusBeforeServer = spawnSync("git", ["status", "--short"], {
  cwd: repositoryRoot,
  encoding: "utf8",
}).stdout;
const projectBeforeServer = await snapshotProject(projectRoot);
const port = await availablePort();
const serverOutput = [];
const viewer = spawn("./scripts/open-content.sh", [projectRoot], {
  cwd: repositoryRoot,
  env: {
    ...process.env,
    LCT_OPEN_CONTENT_PORT: String(port),
    LCT_OPEN_CONTENT_VALIDATE_ONLY: "0",
  },
  stdio: ["ignore", "pipe", "pipe"],
});
viewer.stdout.on("data", (chunk) => serverOutput.push(chunk.toString()));
viewer.stderr.on("data", (chunk) => serverOutput.push(chunk.toString()));
const output = () => serverOutput.join("");
const viewerExit = new Promise((resolve, reject) => {
  viewer.once("error", reject);
  viewer.once("exit", (code, signal) => resolve({ code, signal }));
});

const baseUrl = `http://127.0.0.1:${port}`;
try {
  const landing = await waitForResponse(`${baseUrl}/open-content`, viewer, output);
  const landingHtml = await landing.text();
  assert.match(landingHtml, /First lesson/);
  assert.match(landingHtml, /Second lesson/);

  const viewerResponse = await fetch(`${baseUrl}/open-content/view/reload.lcm`);
  assert.equal(viewerResponse.status, 200);
  assert.match(await viewerResponse.text(), /After reload/);

  const resourceResponse = await fetch(`${baseUrl}/open-content/resources/media/sample%20audio.mp3`);
  assert.equal(resourceResponse.status, 200);
  assert.equal(resourceResponse.headers.get("content-type"), "audio/mpeg");
  assert.match(resourceResponse.headers.get("cache-control") ?? "", /no-store/);
  assert.equal(await resourceResponse.text(), "test audio");

  const sampleResponse = await fetch(`${baseUrl}/contents/generated/decomposition-minimum`);
  assert.equal(sampleResponse.status, 200);
  assert.deepEqual(await snapshotProject(projectRoot), projectBeforeServer, "starting and requesting the Viewer must not write to the external project");

  await writeFile(reloadPath, lcm("HTTP reload", resourceBlock));
  const reloadedResponse = await fetch(`${baseUrl}/open-content/view/reload.lcm`);
  assert.equal(reloadedResponse.status, 200);
  assert.match(await reloadedResponse.text(), /HTTP reload/);

  await writeFile(invalidPath, "not front matter");
  const compileErrorResponse = await fetch(`${baseUrl}/open-content/view/invalid.lcm`);
  assert.equal(compileErrorResponse.status, 200);
  const compileErrorHtml = await compileErrorResponse.text();
  assert.match(compileErrorHtml, /LCM compile error/);
  assert.match(compileErrorHtml, /invalid\.lcm/);
  assert.match(compileErrorHtml, /expected front matter/);
  assert.match(output(), /open-content: Failed to compile invalid\.lcm/);
  await unlink(invalidPath);

  const statusAfterRequests = spawnSync("git", ["status", "--short"], {
    cwd: repositoryRoot,
    encoding: "utf8",
  }).stdout;
  assert.equal(statusAfterRequests, statusBeforeServer, "running the Viewer must not change tracked or untracked LCT files");
} finally {
  if (viewer.exitCode == null) viewer.kill("SIGINT");
}

let stopTimer;
const stopTimeout = new Promise((_, reject) => {
  stopTimer = setTimeout(() => reject(new Error(`Viewer did not stop after Ctrl-C\n${output()}`)), 15_000);
});
const stopped = await Promise.race([viewerExit, stopTimeout]);
clearTimeout(stopTimer);
assert.ok(stopped.code === 130 || stopped.signal === "SIGINT", `unexpected Viewer exit: ${JSON.stringify(stopped)}\n${output()}`);
await assert.rejects(fetch(`${baseUrl}/open-content`, { signal: AbortSignal.timeout(1_000) }));

assert.equal(await readFile(path.join(projectRoot, "media", "sample audio.mp3"), "utf8"), "test audio");
await rm(temporaryRoot, { recursive: true, force: true });
console.log("open-content checks passed");
