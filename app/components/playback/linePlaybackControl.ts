import type { LinePlaybackRange } from "./playbackState";

export function activateLinePlaybackControl({
  range,
  playLine,
}: {
  range: LinePlaybackRange | null | undefined;
  playLine: ((range: LinePlaybackRange) => void) | undefined;
}) {
  if (range) playLine?.(range);
}
