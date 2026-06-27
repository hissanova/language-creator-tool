import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { compileLcmFile, serializeGeneratedFixture } from "./compile-lcm.mjs";
import { lcmFixtures } from "./fixtures.mjs";

for (const fixture of lcmFixtures) {
  const document = await compileLcmFile(fixture.sourcePath);
  await mkdir(path.dirname(fixture.outputPath), { recursive: true });
  await writeFile(
    fixture.outputPath,
    serializeGeneratedFixture(document, fixture.sourcePath),
    "utf8",
  );
  console.log(`Generated ${path.relative(process.cwd(), fixture.outputPath)}`);
}
