import { readFile, realpath } from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";

const repositoryRoot = await realpath(process.argv[2]);
let previousCommit;
let resultingCommit;
let gitWasUpdated = false;

function run(command, args, { allowFailure = false, inherit = false } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: repositoryRoot,
      stdio: inherit ? "inherit" : ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    if (!inherit) {
      child.stdout.on("data", (chunk) => { stdout += chunk; });
      child.stderr.on("data", (chunk) => { stderr += chunk; });
    }
    child.once("error", reject);
    child.once("close", (code, signal) => {
      const result = { code: code ?? 1, signal, stdout: stdout.trim(), stderr: stderr.trim() };
      if (result.code === 0 || allowFailure) resolve(result);
      else reject(new Error(`${command} ${args.join(" ")} failed${result.stderr ? `: ${result.stderr}` : ""}`));
    });
  });
}

async function git(args, options) {
  return run("git", args, options);
}

function stop(message, nextAction) {
  console.error(`Update stopped: ${message}`);
  console.error("No working files were changed.");
  if (nextAction) console.error(`Next: ${nextAction}`);
  process.exitCode = 1;
}

function parseMinimumVersion(requirement) {
  const match = requirement.match(/^>=\s*(\d+)\.(\d+)\.(\d+)$/);
  return match ? match.slice(1).map(Number) : undefined;
}

function meetsMinimumVersion(currentVersion, minimum) {
  const current = currentVersion.replace(/^v/, "").split(".").slice(0, 3).map(Number);
  for (let index = 0; index < minimum.length; index += 1) {
    if (current[index] > minimum[index]) return true;
    if (current[index] < minimum[index]) return false;
  }
  return true;
}

async function validateNodeVersion() {
  const packageJson = JSON.parse(await readFile(path.join(repositoryRoot, "package.json"), "utf8"));
  const requirement = packageJson.engines?.node;
  const minimum = typeof requirement === "string" ? parseMinimumVersion(requirement) : undefined;
  if (!minimum) {
    throw new Error(`cannot validate the Node.js requirement in package.json (${requirement ?? "missing"})`);
  }
  if (!meetsMinimumVersion(process.version, minimum)) {
    throw new Error(`Node.js ${requirement} is required (current: ${process.version}). Install or select a supported Node.js version`);
  }
}

async function runUpdate() {
  const topLevel = await git(["rev-parse", "--show-toplevel"], { allowFailure: true });
  if (topLevel.code !== 0 || await realpath(topLevel.stdout) !== repositoryRoot) {
    stop("the update script is not inside a valid LCT Git repository.", "Restore or clone LCT, then run its scripts/update.sh command.");
    return;
  }

  const status = await git(["status", "--porcelain=v1", "--untracked-files=normal"]);
  if (status.stdout) {
    stop("the LCT working tree has local changes.", "Commit or remove those changes manually, then run ./scripts/update.sh again.");
    return;
  }

  const branch = await git(["branch", "--show-current"]);
  if (branch.stdout !== "main") {
    stop(`current branch is ${branch.stdout || "detached HEAD"}; expected main.`, "Switch to main manually, then run ./scripts/update.sh again.");
    return;
  }

  const upstream = await git(["rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{upstream}"], { allowFailure: true });
  const remote = await git(["config", "--get", "branch.main.remote"], { allowFailure: true });
  const mergeRef = await git(["config", "--get", "branch.main.merge"], { allowFailure: true });
  if (upstream.code !== 0 || remote.code !== 0 || mergeRef.code !== 0 || !upstream.stdout || !remote.stdout || remote.stdout === "." || !mergeRef.stdout.startsWith("refs/heads/")) {
    stop("main does not have a usable remote upstream.", "Configure main to track its remote branch, then run ./scripts/update.sh again.");
    return;
  }

  previousCommit = (await git(["rev-parse", "HEAD"])).stdout;
  const fetchResult = await git(["fetch", "--no-tags", remote.stdout, mergeRef.stdout], { allowFailure: true, inherit: false });
  if (fetchResult.code !== 0) {
    stop(`could not fetch ${upstream.stdout}.${fetchResult.stderr ? ` ${fetchResult.stderr}` : ""}`, "Check the network and Git credentials, then run ./scripts/update.sh again.");
    return;
  }

  const fetchedCommit = (await git(["rev-parse", "FETCH_HEAD"])).stdout;
  const statusAfterFetch = await git(["status", "--porcelain=v1", "--untracked-files=normal"]);
  const branchAfterFetch = await git(["branch", "--show-current"]);
  const headAfterFetch = (await git(["rev-parse", "HEAD"])).stdout;
  if (statusAfterFetch.stdout || branchAfterFetch.stdout !== "main" || headAfterFetch !== previousCommit) {
    stop("the local Git state changed while checking for updates.", "Finish the other Git or editing operation, then run ./scripts/update.sh again.");
    return;
  }
  const fetchedIsCurrent = await git(["merge-base", "--is-ancestor", fetchedCommit, previousCommit], { allowFailure: true });
  const currentCanFastForward = await git(["merge-base", "--is-ancestor", previousCommit, fetchedCommit], { allowFailure: true });

  if (previousCommit !== fetchedCommit && currentCanFastForward.code !== 0 && fetchedIsCurrent.code !== 0) {
    stop(`local main and ${upstream.stdout} have diverged.`, "Ask a maintainer to resolve the Git history; this updater will not merge or rebase it.");
    return;
  }
  if (previousCommit !== fetchedCommit && fetchedIsCurrent.code === 0) {
    stop(`local main contains commits that are not on ${upstream.stdout}.`, "Review or push those commits manually before updating.");
    return;
  }

  if (previousCommit !== fetchedCommit) {
    const fastForward = await git(["merge", "--ff-only", fetchedCommit], { allowFailure: true, inherit: true });
    if (fastForward.code !== 0) {
      stop("the fast-forward update failed.", "Inspect the Git state manually; no merge or rebase was attempted.");
      return;
    }
    gitWasUpdated = true;
  }

  resultingCommit = (await git(["rev-parse", "HEAD"])).stdout;
  console.log(`Previous commit: ${previousCommit}`);
  console.log(`Current commit:  ${resultingCommit}`);

  try {
    await validateNodeVersion();
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    if (gitWasUpdated) {
      console.error(`LCT code was updated, but dependencies are not ready: ${detail}.`);
    } else {
      console.error(`LCT code is already current, but dependencies are not ready: ${detail}.`);
    }
    console.error("Next: select the required Node.js version, then run: npm ci");
    process.exitCode = 1;
    return;
  }

  const npmResult = await run("npm", ["ci"], { allowFailure: true, inherit: true });
  if (npmResult.code !== 0) {
    if (gitWasUpdated) {
      console.error(`LCT updated: ${previousCommit.slice(0, 7)} -> ${resultingCommit.slice(0, 7)}, but dependency installation failed.`);
    } else {
      console.error("LCT is already up to date, but dependency installation failed.");
    }
    console.error("Next: fix the npm error above, then run: npm ci");
    process.exitCode = 1;
    return;
  }

  if (gitWasUpdated) console.log(`LCT updated: ${previousCommit.slice(0, 7)} -> ${resultingCommit.slice(0, 7)}`);
  else console.log("LCT is already up to date.");
  console.log("Dependencies are ready.");
  console.log("Next: ./scripts/open-content.sh <project-folder>");
}

try {
  await runUpdate();
} catch (error) {
  const detail = error instanceof Error ? error.message : String(error);
  if (gitWasUpdated) {
    console.error(`LCT code was updated, but the update could not finish: ${detail}`);
    console.error("Next: inspect the error, then run: npm ci");
  } else {
    stop(detail, "Fix the error, then run ./scripts/update.sh again.");
  }
  process.exitCode = 1;
}
