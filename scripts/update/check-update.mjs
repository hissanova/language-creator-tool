import assert from "node:assert/strict";
import { chmod, copyFile, mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const repositoryRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "lct update checks "));
const remotePath = path.join(temporaryRoot, "remote repository.git");
const seedPath = path.join(temporaryRoot, "seed repository");
const fakeBin = path.join(temporaryRoot, "fake bin");
const externalContentPath = path.join(temporaryRoot, "Simon's teaching materials");
const npmLog = path.join(temporaryRoot, "npm calls.log");

function run(command, args, options = {}) {
  return spawnSync(command, args, {
    encoding: "utf8",
    ...options,
  });
}

function git(cwd, args) {
  const result = run("git", args, { cwd });
  assert.equal(result.status, 0, `git ${args.join(" ")} failed\n${result.stderr}`);
  return result.stdout.trim();
}

async function createClone(name) {
  const clonePath = path.join(temporaryRoot, name);
  git(temporaryRoot, ["clone", remotePath, clonePath]);
  git(clonePath, ["config", "user.name", "LCT Update Test"]);
  git(clonePath, ["config", "user.email", "update-test@example.invalid"]);
  return clonePath;
}

function runUpdate(clonePath, { args = [], cwd = clonePath, npmFails = false } = {}) {
  return run("sh", [path.join(clonePath, "scripts", "update.sh"), ...args], {
    cwd,
    env: {
      ...process.env,
      PATH: `${fakeBin}${path.delimiter}${process.env.PATH}`,
      LCT_TEST_NPM_LOG: npmLog,
      LCT_TEST_NPM_FAIL: npmFails ? "1" : "0",
    },
  });
}

async function pushRemoteCommit(filename, contents) {
  const updaterPath = await createClone(`remote updater ${filename.replaceAll("/", "-")}`);
  await writeFile(path.join(updaterPath, filename), contents);
  git(updaterPath, ["add", filename]);
  git(updaterPath, ["commit", "-m", `Update ${filename}`]);
  git(updaterPath, ["push", "origin", "main"]);
  return git(updaterPath, ["rev-parse", "HEAD"]);
}

try {
  await mkdir(fakeBin);
  await writeFile(path.join(fakeBin, "npm"), `#!/bin/sh
printf '%s\\n' "$*" >> "$LCT_TEST_NPM_LOG"
if [ "$LCT_TEST_NPM_FAIL" = "1" ]; then
  printf '%s\\n' "simulated npm ci failure" >&2
  exit 17
fi
exit 0
`);
  await chmod(path.join(fakeBin, "npm"), 0o755);

  await mkdir(externalContentPath);
  await writeFile(path.join(externalContentPath, "lesson.lcm"), "user-authored lesson\n");
  await writeFile(path.join(externalContentPath, "local-settings.yaml"), "theme: personal\n");
  const externalBefore = await Promise.all([
    readFile(path.join(externalContentPath, "lesson.lcm"), "utf8"),
    readFile(path.join(externalContentPath, "local-settings.yaml"), "utf8"),
  ]);

  git(temporaryRoot, ["init", "--bare", remotePath]);
  git(temporaryRoot, ["init", "-b", "main", seedPath]);
  git(seedPath, ["config", "user.name", "LCT Update Test"]);
  git(seedPath, ["config", "user.email", "update-test@example.invalid"]);
  await mkdir(path.join(seedPath, "scripts"), { recursive: true });
  await copyFile(path.join(repositoryRoot, "scripts", "update.sh"), path.join(seedPath, "scripts", "update.sh"));
  await copyFile(path.join(repositoryRoot, "scripts", "update.mjs"), path.join(seedPath, "scripts", "update.mjs"));
  await chmod(path.join(seedPath, "scripts", "update.sh"), 0o755);
  await writeFile(path.join(seedPath, "package.json"), JSON.stringify({ engines: { node: ">=18.0.0" } }, null, 2));
  await writeFile(path.join(seedPath, "package-lock.json"), JSON.stringify({ name: "lct-update-fixture", lockfileVersion: 3, requires: true, packages: {} }, null, 2));
  git(seedPath, ["add", "."]);
  git(seedPath, ["commit", "-m", "Initial update fixture"]);
  git(seedPath, ["remote", "add", "origin", remotePath]);
  git(seedPath, ["push", "-u", "origin", "main"]);
  git(remotePath, ["symbolic-ref", "HEAD", "refs/heads/main"]);

  const outsideClone = await createClone("checkout with spaces");
  const outsideResult = runUpdate(outsideClone, { cwd: externalContentPath });
  assert.equal(outsideResult.status, 0, outsideResult.stderr);
  assert.match(outsideResult.stdout, /LCT is already up to date/);
  assert.match(outsideResult.stdout, /Next: \.\/scripts\/open-content\.sh <project-folder>/);

  const argumentResult = runUpdate(outsideClone, { args: ["unexpected"] });
  assert.notEqual(argumentResult.status, 0);
  assert.match(argumentResult.stderr, /does not accept arguments/);
  assert.match(argumentResult.stderr, /No files were changed/);

  const dirtyTracked = await createClone("dirty tracked checkout");
  await writeFile(path.join(dirtyTracked, "package.json"), "changed locally\n");
  const dirtyTrackedResult = runUpdate(dirtyTracked);
  assert.notEqual(dirtyTrackedResult.status, 0);
  assert.match(dirtyTrackedResult.stderr, /working tree has local changes/);
  assert.equal(await readFile(path.join(dirtyTracked, "package.json"), "utf8"), "changed locally\n");

  const dirtyUntracked = await createClone("dirty untracked checkout");
  await writeFile(path.join(dirtyUntracked, "personal-settings.yaml"), "keep: true\n");
  const dirtyUntrackedResult = runUpdate(dirtyUntracked);
  assert.notEqual(dirtyUntrackedResult.status, 0);
  assert.match(dirtyUntrackedResult.stderr, /working tree has local changes/);
  assert.equal(await readFile(path.join(dirtyUntracked, "personal-settings.yaml"), "utf8"), "keep: true\n");

  const wrongBranch = await createClone("wrong branch checkout");
  git(wrongBranch, ["switch", "-c", "work"]);
  const wrongBranchResult = runUpdate(wrongBranch);
  assert.notEqual(wrongBranchResult.status, 0);
  assert.match(wrongBranchResult.stderr, /current branch is work; expected main/);

  const missingUpstream = await createClone("missing upstream checkout");
  git(missingUpstream, ["branch", "--unset-upstream"]);
  const missingUpstreamResult = runUpdate(missingUpstream);
  assert.notEqual(missingUpstreamResult.status, 0);
  assert.match(missingUpstreamResult.stderr, /does not have a usable remote upstream/);

  const alreadyCurrent = await createClone("already current checkout");
  const alreadyCurrentHead = git(alreadyCurrent, ["rev-parse", "HEAD"]);
  const alreadyCurrentResult = runUpdate(alreadyCurrent);
  assert.equal(alreadyCurrentResult.status, 0, alreadyCurrentResult.stderr);
  assert.equal(git(alreadyCurrent, ["rev-parse", "HEAD"]), alreadyCurrentHead);
  assert.match(alreadyCurrentResult.stdout, new RegExp(`Previous commit: ${alreadyCurrentHead}`));
  assert.match(alreadyCurrentResult.stdout, /Dependencies are ready/);

  const fastForwardClone = await createClone("fast forward checkout");
  const fastForwardOldHead = git(fastForwardClone, ["rev-parse", "HEAD"]);
  const fastForwardNewHead = await pushRemoteCommit("release-note.txt", "safe update\n");
  const fastForwardResult = runUpdate(fastForwardClone);
  assert.equal(fastForwardResult.status, 0, fastForwardResult.stderr);
  assert.equal(git(fastForwardClone, ["rev-parse", "HEAD"]), fastForwardNewHead);
  assert.match(fastForwardResult.stdout, new RegExp(`LCT updated: ${fastForwardOldHead.slice(0, 7)} -> ${fastForwardNewHead.slice(0, 7)}`));

  const divergentClone = await createClone("divergent checkout");
  await writeFile(path.join(divergentClone, "local-only.txt"), "local commit\n");
  git(divergentClone, ["add", "local-only.txt"]);
  git(divergentClone, ["commit", "-m", "Local-only commit"]);
  const divergentHead = git(divergentClone, ["rev-parse", "HEAD"]);
  await pushRemoteCommit("remote-only.txt", "remote commit\n");
  const divergentResult = runUpdate(divergentClone);
  assert.notEqual(divergentResult.status, 0);
  assert.match(divergentResult.stderr, /have diverged/);
  assert.match(divergentResult.stderr, /will not merge or rebase/);
  assert.equal(git(divergentClone, ["rev-parse", "HEAD"]), divergentHead);

  const dependencyFailureClone = await createClone("dependency failure checkout");
  const dependencyOldHead = git(dependencyFailureClone, ["rev-parse", "HEAD"]);
  const dependencyNewHead = await pushRemoteCommit("dependency-change.txt", "new dependency state\n");
  const dependencyFailureResult = runUpdate(dependencyFailureClone, { npmFails: true });
  assert.notEqual(dependencyFailureResult.status, 0);
  assert.equal(git(dependencyFailureClone, ["rev-parse", "HEAD"]), dependencyNewHead);
  assert.match(dependencyFailureResult.stderr, /dependency installation failed/);
  assert.match(dependencyFailureResult.stderr, /then run: npm ci/);
  assert.match(dependencyFailureResult.stderr, new RegExp(`${dependencyOldHead.slice(0, 7)} -> ${dependencyNewHead.slice(0, 7)}`));

  const npmCalls = (await readFile(npmLog, "utf8")).trim().split("\n");
  assert.ok(npmCalls.length >= 4);
  assert.ok(npmCalls.every((call) => call === "ci"), `unexpected npm call: ${npmCalls.join(", ")}`);

  assert.deepEqual(await Promise.all([
    readFile(path.join(externalContentPath, "lesson.lcm"), "utf8"),
    readFile(path.join(externalContentPath, "local-settings.yaml"), "utf8"),
  ]), externalBefore, "the updater must not modify external content or its local settings");

  console.log("update checks passed");
} finally {
  await rm(temporaryRoot, { recursive: true, force: true });
}
