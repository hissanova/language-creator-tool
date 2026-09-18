import type { FormedText, LanguageId } from "../types/core/common";
import type { ImageResource, Resource } from "../types/core/document";

/**
 * Shared, presentation-agnostic queries over `SectionBlock` content
 * (figures, captions, resources). These are pure lookups only; how the
 * result is styled or laid out is left to each viewer.
 */

export function findImageResource(
  resources: readonly Resource[] | undefined,
  resourceId: string,
): ImageResource | undefined {
  return resources?.find(
    (resource): resource is ImageResource => resource.id === resourceId && resource.type === "image",
  );
}

export function firstCaption(
  caption: Record<LanguageId, FormedText> | FormedText[] | undefined,
): string | undefined {
  if (Array.isArray(caption)) return caption[0]?.text;
  return Object.values(caption ?? {})[0]?.text;
}
