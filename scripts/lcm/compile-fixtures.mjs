import path from "node:path";
import {
  compileLcmToDocument,
  generatedExportName,
  writeDocumentModule,
} from "./compile-lcm.mjs";
import { lcmFixtures } from "./fixtures.mjs";

for (const fixture of lcmFixtures) {
  const document = await compileLcmToDocument(fixture.sourcePath);
  await writeDocumentModule({
    document,
    inputPath: fixture.sourcePath,
    outputPath: fixture.outputPath,
    exportName: generatedExportName(fixture.sourcePath),
  });
  console.log(`Generated ${path.relative(process.cwd(), fixture.outputPath)}`);
}
