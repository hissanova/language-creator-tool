import type { MediaResource, Resource } from "../../types/core/document";
import type { TextLine } from "../../types/core/textLine";
import { getAlignmentRef } from "../script-line/coreQueries";
import type { LinePlaybackRange } from "./playbackState";

export function resolveLinePlaybackRange(
  textLine: TextLine,
  resources: Resource[],
  normalizeSource: (source: string) => string,
  knownDuration?: { mediaSource: string | null; duration: number | null },
): LinePlaybackRange | null {
  const alignment = getAlignmentRef(textLine.textLineRefs)?.body;
  if (!alignment) return null;

  const { start, end } = alignment.interval;
  const media = resources.find(
    (resource): resource is MediaResource =>
      resource.id === alignment.mediaRef.resourceId &&
      resource.type === "media" &&
      resource.mediaType === "audio",
  );

  if (
    !media ||
    !media.src ||
    !Number.isFinite(start) ||
    !Number.isFinite(end) ||
    start < 0 ||
    end == null ||
    end <= start
  ) {
    return null;
  }

  const mediaSource = normalizeSource(media.src);
  if (
    knownDuration?.mediaSource === mediaSource &&
    knownDuration.duration != null &&
    end > knownDuration.duration
  ) {
    return null;
  }

  return {
    type: "line",
    lineId: textLine.id,
    mediaResourceId: media.id,
    mediaSource,
    start,
    end,
  };
}
