import path from "node:path";

import { readProjectResource } from "@/scripts/open-content/project.mjs";

export const dynamic = "force-dynamic";

const contentTypes: Record<string, string> = {
  ".avif": "image/avif",
  ".gif": "image/gif",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".m4a": "audio/mp4",
  ".mp3": "audio/mpeg",
  ".mp4": "video/mp4",
  ".ogg": "audio/ogg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".wav": "audio/wav",
  ".webm": "video/webm",
  ".webp": "image/webp",
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ resourcePath: string[] }> },
) {
  const root = process.env.LCT_EXTERNAL_CONTENT_ROOT;
  if (!root) return new Response("External content is not configured", { status: 404 });

  const { resourcePath } = await params;
  const relativePath = resourcePath.join("/");
  try {
    const contents = await readProjectResource(root, relativePath);
    const contentType = contentTypes[path.extname(relativePath).toLowerCase()] ?? "application/octet-stream";
    return new Response(new Uint8Array(contents), {
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": contentType,
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`open-content resource: ${message}`);
    return new Response("Resource not found", { status: 404 });
  }
}
