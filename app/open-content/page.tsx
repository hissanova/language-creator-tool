import Link from "next/link";
import { connection } from "next/server";

import { inspectExternalProject } from "@/scripts/open-content/project.mjs";

function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="rounded border border-red-300 bg-red-50 p-4 text-red-900">
      <h2 className="font-semibold">External content could not be loaded</h2>
      <pre className="mt-2 whitespace-pre-wrap text-sm">{message}</pre>
    </div>
  );
}

export default async function ExternalContentPage() {
  await connection();
  const root = process.env.LCT_EXTERNAL_CONTENT_ROOT;

  if (!root) {
    return (
      <main className="mx-auto max-w-3xl p-6">
        <h1 className="mb-4 text-2xl font-bold">External content</h1>
        <ErrorMessage message="No external project is configured. Start this Viewer from the LCT repository root with: ./scripts/open-content.sh <project-folder>" />
      </main>
    );
  }

  let documents;
  let loadError: string | undefined;
  try {
    documents = await inspectExternalProject(root);
  } catch (error) {
    loadError = error instanceof Error ? error.message : String(error);
    console.error(`open-content: ${loadError}`);
  }

  if (loadError || !documents) {
    return (
      <main className="mx-auto max-w-3xl p-6">
        <h1 className="mb-4 text-2xl font-bold">External content</h1>
        <ErrorMessage message={loadError ?? "External content could not be loaded"} />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="mb-2 text-2xl font-bold">External content</h1>
      <p className="mb-6 break-all text-sm text-gray-600">{root}</p>
      <ul className="space-y-3">
        {documents.map((document) => (
          <li key={document.relativePath} className="rounded border bg-white p-4 text-gray-950">
            <Link href={document.href} className="font-semibold text-blue-600 underline">
              {document.title}
            </Link>
            <div className="mt-1 text-sm text-gray-600">{document.relativePath}</div>
          </li>
        ))}
      </ul>
    </main>
  );
}
