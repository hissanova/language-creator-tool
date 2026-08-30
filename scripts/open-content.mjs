import { access, realpath, stat } from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

import { externalContentRoute, inspectExternalProject } from "./open-content/project.mjs";

const minimumNodeVersion = [20, 9, 0];
const scriptPath = fileURLToPath(import.meta.url);
const repositoryRoot = path.dirname(path.dirname(scriptPath));
const usage = "Usage: ./scripts/open-content.sh <project-folder>";

function fail(message) {
  console.error(`open-content: ${message}`);
  console.error(usage);
  process.exitCode = 1;
}

function hasMinimumNodeVersion(version) {
  const current = version.replace(/^v/, "").split(".").slice(0, 3).map(Number);
  for (let index = 0; index < minimumNodeVersion.length; index += 1) {
    if (current[index] > minimumNodeVersion[index]) return true;
    if (current[index] < minimumNodeVersion[index]) return false;
  }
  return true;
}

async function validateEnvironment() {
  if (!hasMinimumNodeVersion(process.version)) {
    throw new Error(`Node.js >=20.9.0 is required (current: ${process.version}). Install or select a supported Node.js version; this command does not run nvm or install Node.js.`);
  }

  const currentRoot = await realpath(process.cwd());
  const canonicalRepositoryRoot = await realpath(repositoryRoot);
  if (currentRoot !== canonicalRepositoryRoot) {
    throw new Error(`run this command from the LCT repository root: ${canonicalRepositoryRoot}`);
  }

  try {
    await access(path.join(repositoryRoot, "node_modules", "next", "package.json"), constants.R_OK);
  } catch {
    throw new Error("npm dependencies are not installed. Run: npm install");
  }
}

async function validateProject(argument) {
  const projectPath = path.resolve(process.cwd(), argument);
  let projectStat;
  try {
    projectStat = await stat(projectPath);
  } catch {
    throw new Error(`project folder does not exist: ${argument}`);
  }
  if (!projectStat.isDirectory()) {
    throw new Error(`project path is not a directory: ${argument}`);
  }

  const root = await realpath(projectPath);
  const documents = await inspectExternalProject(root);
  return { root, documents };
}

async function run() {
  if (process.argv.length !== 3) {
    fail(process.argv.length < 3 ? "missing project folder" : "expected exactly one project folder");
    return;
  }

  try {
    await validateEnvironment();
    const { root, documents } = await validateProject(process.argv[2]);
    console.log(`External content: ${root}`);
    console.log(`LCM documents: ${documents.length}`);

    if (process.env.LCT_OPEN_CONTENT_VALIDATE_ONLY === "1") {
      for (const document of documents) console.log(`- ${document.relativePath}`);
      return;
    }

    const port = process.env.LCT_OPEN_CONTENT_PORT ?? "3000";
    if (!/^\d+$/.test(port) || Number(port) < 1 || Number(port) > 65535) {
      throw new Error(`invalid LCT_OPEN_CONTENT_PORT: ${port}`);
    }
    const url = `http://127.0.0.1:${port}${externalContentRoute}`;

    const child = spawn("npm", ["run", "dev", "--", "--hostname", "127.0.0.1", "--port", port], {
      cwd: repositoryRoot,
      detached: process.platform !== "win32",
      env: { ...process.env, LCT_EXTERNAL_CONTENT_ROOT: root },
      stdio: "inherit",
    });
    console.log(`Open in your browser: ${url}`);
    console.log("Press Ctrl-C to stop the local Viewer.");

    let stopping = false;
    const stop = (signal) => {
      if (stopping) return;
      stopping = true;
      if (process.platform === "win32") child.kill(signal);
      else {
        try {
          process.kill(-child.pid, signal);
        } catch {
          child.kill(signal);
        }
      }
    };
    process.once("SIGINT", () => stop("SIGINT"));
    process.once("SIGTERM", () => stop("SIGTERM"));

    const result = await new Promise((resolve, reject) => {
      child.once("error", reject);
      child.once("exit", (code, signal) => resolve({ code, signal }));
    });
    if (result.signal === "SIGINT") process.exitCode = 130;
    else if (result.signal === "SIGTERM") process.exitCode = 143;
    else process.exitCode = result.code ?? 1;
  } catch (error) {
    fail(error instanceof Error ? error.message : String(error));
  }
}

await run();
