import type { LinePlaybackRange, PlaybackState } from "./playbackState";

export function formatPlaybackTime(value: number | null) {
  if (value == null || !Number.isFinite(value) || value < 0) return "--:--.---";

  const totalMilliseconds = Math.round(value * 1000);
  const milliseconds = totalMilliseconds % 1000;
  const totalSeconds = Math.floor(totalMilliseconds / 1000);
  const seconds = totalSeconds % 60;
  const totalMinutes = Math.floor(totalSeconds / 60);
  const minutes = totalMinutes % 60;
  const hours = Math.floor(totalMinutes / 60);
  const millisecondText = milliseconds.toString().padStart(3, "0");
  const secondText = seconds.toString().padStart(2, "0");

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secondText}.${millisecondText}`;
  }

  return `${totalMinutes}:${secondText}.${millisecondText}`;
}

export function getLoopRangePercentages(
  range: Pick<LinePlaybackRange, "start" | "end">,
  duration: number | null,
) {
  if (duration == null || !Number.isFinite(duration) || duration <= 0) {
    return null;
  }

  const start = Math.max(0, Math.min(100, (range.start / duration) * 100));
  const end = Math.max(start, Math.min(100, (range.end / duration) * 100));
  return { start, width: end - start };
}

export function getPlaybackProgressPercentage(
  currentTime: number,
  duration: number | null,
) {
  if (
    !Number.isFinite(currentTime) ||
    duration == null ||
    !Number.isFinite(duration) ||
    duration <= 0
  ) {
    return 0;
  }

  return Math.max(0, Math.min(100, (currentTime / duration) * 100));
}

export function getLoopRangeVisualStyle(
  percentages: { start: number; width: number },
  minimumWidth = 5,
) {
  const visualWidth = `max(${percentages.width}%, ${minimumWidth}px)`;

  return {
    // Keep the natural start unless the minimum visual width would overflow the
    // right edge. Exact semantic boundaries remain available as separate markers.
    left: `min(${percentages.start}%, calc(100% - ${visualWidth}))`,
    width: visualWidth,
  };
}

export function isLineCurrentlyPlaying(
  state: Pick<
    PlaybackState,
    | "playing"
    | "mediaSource"
    | "currentTime"
    | "loopEnabled"
    | "selectedLoopRange"
    | "loopRangeEngaged"
  >,
  range: LinePlaybackRange | null | undefined,
) {
  if (!state.playing || !range) return false;

  if (
    state.loopEnabled &&
    state.selectedLoopRange &&
    state.loopRangeEngaged
  ) {
    return Boolean(
      state.selectedLoopRange.lineId === range.lineId &&
        state.selectedLoopRange.mediaSource === state.mediaSource &&
        range.mediaSource === state.mediaSource,
    );
  }

  return Boolean(
    range.mediaSource === state.mediaSource &&
      state.currentTime >= range.start &&
      state.currentTime < range.end,
  );
}
