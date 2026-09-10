export function normalizeMediaSrc(src: string) {
  if (src.startsWith("/public/")) {
    return src.slice("/public".length);
  }

  if (src.startsWith("@/public/")) {
    return `/${src.slice("@/public/".length)}`;
  }

  return src;
}
