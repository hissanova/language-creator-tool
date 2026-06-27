import Link from "next/link";

export default function Home() {
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
      <h1 className="mt-6 mb-4 text-2xl font-bold">
        Generated sample JSON files
      </h1>
      <Link
        href="/contents/generated/viewer-conversation-smoke"
        className="text-blue-600 underline"
      >
        viewer-conversation-smoke.generated.json
      </Link>
      <br />
      <Link
        href="/contents/generated/decomposition-minimum"
        className="text-blue-600 underline"
      >
        decomposition-minimum.generated.json
      </Link>
      <br />
      <Link
        href="/contents/generated/decomposition-nested-minimum"
        className="text-blue-600 underline"
      >
        decomposition-nested-minimum.generated.json
      </Link>
      
    </main>
  );
}