import Link from "next/link";
import { viewerSamples } from "@/samples/core-json/sampleRegistry";

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
      <br />
      <Link
        href="/open-content"
        className="text-blue-600 underline"
      >
        Open external content
      </Link>
      <h1 className="mt-6 mb-4 text-2xl font-bold">
        Built-in Viewer samples
      </h1>
      {viewerSamples.map((sample) => (
        <div key={sample.id}>
          <Link
            href={`/contents/generated/${sample.id}`}
            className="text-blue-600 underline"
          >
            {sample.label}
          </Link>
        </div>
      ))}
    </main>
  );
}
