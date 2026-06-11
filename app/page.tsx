import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="mb-4 text-2xl font-bold">
        Language Creator Tool
      </h1>

      <Link
        href="/lessons/sample"
        className="text-blue-600 underline"
      >
        Open sample lesson
      </Link>
      <br />
      <Link
        href="/annotations/sample"
        className="text-blue-600 underline"
      >
        Open sample annotations
      </Link>
      
    </main>
  );
}