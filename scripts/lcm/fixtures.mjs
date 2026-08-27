import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

export const lcmFixtures = [
  "viewer-conversation-smoke",
  "decomposition-minimum",
  "decomposition-nested-minimum",
].map((name) => ({
  name,
  sourcePath: path.join(repositoryRoot, "samples", "markup", `${name}.lcm`),
  outputPath: path.join(
    repositoryRoot,
    "samples",
    "core-json",
    "generated",
    `${name}.generated.ts`,
  ),
}));

