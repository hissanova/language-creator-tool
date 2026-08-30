import { realpath, readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";

import { compileLcmToDocument } from "../lcm/compile-lcm.mjs";

export const externalContentRoute = "/open-content";
export const externalResourceRoute = `${externalContentRoute}/resources`;

const ignoredDirectoryNames = new Set([
  "node_modules",
  "build",
  "coverage",
  "dist",
  "out",
]);

function isIgnoredDirectory(name) {
  return name.startsWith(".") || ignoredDirectoryNames.has(name);
}

function isInsideRoot(root, candidate) {
  const relative = path.relative(root, candidate);
  return relative === "" || (!relative.startsWith(`..${path.sep}`) && relative !== ".." && !path.isAbsolute(relative));
}

function validateRelativeParts(relativePath, label) {
  if (!relativePath || path.isAbsolute(relativePath) || relativePath.includes("\\")) {
    throw new Error(`${label} must be a project-relative path`);
  }

  const parts = relativePath.split("/");
  if (parts.some((part) => !part || part === "." || part === ".." || part.includes("\0"))) {
    throw new Error(`${label} contains an invalid path segment`);
  }
  return parts;
}

async function resolveExistingFile(root, relativePath, label) {
  const parts = validateRelativeParts(relativePath, label);
  const candidate = path.resolve(root, ...parts);
  if (!isInsideRoot(root, candidate)) {
    throw new Error(`${label} escapes the external project root`);
  }

  let canonical;
  try {
    canonical = await realpath(candidate);
  } catch {
    throw new Error(`${label} does not exist: ${relativePath}`);
  }
  if (!isInsideRoot(root, canonical)) {
    throw new Error(`${label} resolves outside the external project root`);
  }

  const fileStat = await stat(canonical);
  if (!fileStat.isFile()) {
    throw new Error(`${label} is not a file: ${relativePath}`);
  }
  return canonical;
}

export async function canonicalProjectRoot(projectPath) {
  return realpath(projectPath);
}

export async function discoverLcmDocuments(root) {
  const documents = [];

  async function walk(directory, relativeDirectory = "") {
    const entries = await readdir(directory, { withFileTypes: true });
    entries.sort((left, right) => left.name.localeCompare(right.name, "en"));

    for (const entry of entries) {
      if (entry.isSymbolicLink()) continue;
      const relativePath = relativeDirectory
        ? `${relativeDirectory}/${entry.name}`
        : entry.name;
      if (entry.isDirectory()) {
        if (!isIgnoredDirectory(entry.name)) {
          await walk(path.join(directory, entry.name), relativePath);
        }
      } else if (entry.isFile() && entry.name.endsWith(".lcm")) {
        documents.push(relativePath);
      }
    }
  }

  await walk(root);
  return documents;
}

export function routePathForDocument(relativePath) {
  const parts = validateRelativeParts(relativePath, "LCM path");
  return `${externalContentRoute}/view/${parts.map(encodeURIComponent).join("/")}`;
}

function isRemoteResource(src) {
  return /^(?:https?:|data:|blob:)/i.test(src);
}

export function routePathForResource(relativePath) {
  const parts = validateRelativeParts(relativePath, "Resource path");
  return `${externalResourceRoute}/${parts.map(encodeURIComponent).join("/")}`;
}

export async function resolveProjectResource(root, relativePath) {
  return resolveExistingFile(root, relativePath, "Resource path");
}

async function prepareResources(document, root) {
  if (!document.resources) return document;

  const resources = await Promise.all(document.resources.map(async (resource) => {
    if ((resource.type !== "media" && resource.type !== "image") || isRemoteResource(resource.src)) {
      return resource;
    }

    await resolveProjectResource(root, resource.src);
    return { ...resource, src: routePathForResource(resource.src) };
  }));

  return { ...document, resources };
}

export async function compileExternalDocument(root, relativePath) {
  const documents = await discoverLcmDocuments(root);
  if (!documents.includes(relativePath)) {
    throw new Error(`LCM file is not available in this project: ${relativePath}`);
  }

  const inputPath = await resolveExistingFile(root, relativePath, "LCM path");
  try {
    const document = await compileLcmToDocument(inputPath);
    return await prepareResources(document, root);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to compile ${relativePath}: ${message}`, { cause: error });
  }
}

export async function inspectExternalProject(root) {
  const relativePaths = await discoverLcmDocuments(root);
  if (relativePaths.length === 0) {
    throw new Error(`No .lcm files found under ${root}`);
  }

  const documents = [];
  for (const relativePath of relativePaths) {
    const document = await compileExternalDocument(root, relativePath);
    documents.push({
      relativePath,
      title: document.metadata.title,
      href: routePathForDocument(relativePath),
    });
  }
  return documents;
}

export async function readProjectResource(root, relativePath) {
  const filePath = await resolveProjectResource(root, relativePath);
  return readFile(filePath);
}
