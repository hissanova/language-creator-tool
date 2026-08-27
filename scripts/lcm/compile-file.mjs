import path from "node:path";
import { compileLcmToDocument, writeDocumentModule } from "./compile-lcm.mjs";

const usage =
  "Usage: npm run compile:lcm:file -- --input <path> --output <path> --exportName <name>";

function parseArguments(args) {
  const supportedFlags = new Set(["--input", "--output", "--exportName"]);
  const values = {};

  for (let index = 0; index < args.length; index += 2) {
    const flag = args[index];
    const value = args[index + 1];
    if (!supportedFlags.has(flag)) throw new Error(`Unknown argument ${flag ?? "<missing>"}`);
    if (!value || value.startsWith("--")) throw new Error(`Missing value for ${flag}`);
    if (values[flag]) throw new Error(`Duplicate argument ${flag}`);
    values[flag] = value;
  }

  for (const flag of supportedFlags) {
    if (!values[flag]) throw new Error(`Missing required argument ${flag}`);
  }

  return {
    inputPath: path.resolve(values["--input"]),
    outputPath: path.resolve(values["--output"]),
    exportName: values["--exportName"],
  };
}

try {
  const options = parseArguments(process.argv.slice(2));
  const document = await compileLcmToDocument(options.inputPath);
  await writeDocumentModule({ document, ...options });
  console.log(`Generated ${path.relative(process.cwd(), options.outputPath)}`);
} catch (error) {
  console.error(`compile:lcm:file: ${error instanceof Error ? error.message : String(error)}`);
  console.error(usage);
  process.exitCode = 1;
}

