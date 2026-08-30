import Link from "next/link";
import { connection } from "next/server";

import { ViewerSwitcher } from "@/app/components/ViewerSwitcher";
import type { Document } from "@/app/types/core/document";
import { compileExternalDocument, externalContentRoute } from "@/scripts/open-content/project.mjs";

export default async function ExternalDocumentPage({
  params,
}: {
  params: Promise<{ documentPath: string[] }>;
}) {
  await connection();
  const root = process.env.LCT_EXTERNAL_CONTENT_ROOT;
  const { documentPath } = await params;
  const relativePath = documentPath.join("/");

  if (!root) {
    return (
      <main className="mx-auto max-w-3xl p-6">
        <h1 className="text-2xl font-bold">External content is not configured</h1>
        <p className="mt-3">Run ./scripts/open-content.sh &lt;project-folder&gt; from the LCT repository root.</p>
      </main>
    );
  }

  let document: Document | undefined;
  let compileError: string | undefined;
  try {
    document = await compileExternalDocument(root, relativePath);
  } catch (error) {
    compileError = error instanceof Error ? error.message : String(error);
    console.error(`open-content: ${compileError}`);
  }

  if (compileError || !document) {
    return (
      <main className="mx-auto max-w-3xl p-6">
        <Link href={externalContentRoute} className="text-blue-600 underline">
          Back to external documents
        </Link>
        <div className="mt-4 rounded border border-red-300 bg-red-50 p-4 text-red-900">
          <h1 className="font-semibold">LCM compile error</h1>
          <pre className="mt-2 whitespace-pre-wrap text-sm">{compileError ?? "The document could not be compiled"}</pre>
        </div>
      </main>
    );
  }

  return (
    <>
      <div className="mx-auto max-w-4xl px-6 pt-4">
        <Link href={externalContentRoute} className="text-sm text-blue-600 underline">
          Back to external documents
        </Link>
        <div className="mt-1 text-xs text-gray-500">{relativePath}</div>
      </div>
      <ViewerSwitcher document={document} />
    </>
  );
}
