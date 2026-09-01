import type { LinePlaybackRange } from "./playbackState";

export function activateLinePlaybackControl({
  isLinePlaying,
  range,
  pause,
  playLine,
}: {
  isLinePlaying: boolean;
  range: LinePlaybackRange | null | undefined;
  pause: (() => void) | undefined;
  playLine: ((range: LinePlaybackRange) => void) | undefined;
}) {
  if (isLinePlaying) {
    pause?.();
  } else if (range) {
    playLine?.(range);
  }
}
