import fs from "fs";
import path from "path";
import Link from "next/link";

const generatedDir = path.join(process.cwd(), "app", "contents", "generated");

function getGeneratedSubdirs() {
  return fs
    .readdirSync(generatedDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) => fs.existsSync(path.join(generatedDir, name, "page.tsx")));
}

export default function Home() {
  const generatedSubdirs = getGeneratedSubdirs();

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="mb-4 text-2xl font-bold">
        Language Creator Tool
      </h1>

      <Link
        href="/contents/lessons/sample"
        className="text-blue-600 underline"
      >
        Open sample lesson
      </Link>
      <br />
      <Link
        href="/contents/annotations/sample"
        className="text-blue-600 underline"
      >
        Open sample annotations
      </Link>
      <br />
      <Link
        href="/open-content"
        className="text-blue-600 underline"
      >
        Open external content
      </Link>
      <h1 className="mt-6 mb-4 text-2xl font-bold">
        Generated sample JSON files
      </h1>
      {generatedSubdirs.map((subdir) => (
        <div key={subdir}>
          <Link
            href={`/contents/generated/${subdir}`}
            className="text-blue-600 underline"
          >
            {subdir}.generated.json
          </Link>
        </div>
      ))}
    </main>
  );
}