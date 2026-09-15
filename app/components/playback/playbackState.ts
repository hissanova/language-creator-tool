export const PLAYBACK_RATES = [0.5, 0.75, 1, 1.25, 1.5, 2] as const;

export type PlaybackRate = (typeof PLAYBACK_RATES)[number];

export type LinePlaybackRange = {
  type: "line";
  lineId: string;
  mediaResourceId: string;
  mediaSource: string;
  start: number;
  end: number;
};

export type PlaybackState = {
  mediaResourceId: string | null;
  mediaSource: string | null;
  playing: boolean;
  currentTime: number;
  duration: number | null;
  playbackRate: PlaybackRate;
  selectedLineRange: LinePlaybackRange | null;
  loopEnabled: boolean;
  /** Whether the selected range currently governs playback boundaries. */
  rangeEngaged: boolean;
  playbackEnded: boolean;
};

export const initialPlaybackState: PlaybackState = {
  mediaResourceId: null,
  mediaSource: null,
  playing: false,
  currentTime: 0,
  duration: null,
  playbackRate: 1,
  selectedLineRange: null,
  loopEnabled: false,
  rangeEngaged: false,
  playbackEnded: false,
};

export type PlaybackAction =
  | { type: "hydratePreferences"; playbackRate: PlaybackRate }
  | { type: "setSource"; mediaResourceId: string; mediaSource: string; currentTime?: number; playing?: boolean }
  | { type: "setPlaying"; playing: boolean }
  | { type: "setDuration"; duration: number | null }
  | { type: "setCurrentTime"; currentTime: number }
  | { type: "selectedRangeBoundaryReached"; currentTime: number }
  | { type: "playLine"; range: LinePlaybackRange }
  | { type: "toggleLoop" }
  | { type: "toggleLineLock"; range: LinePlaybackRange }
  | { type: "setRangeEngaged"; engaged: boolean }
  | { type: "seek"; currentTime: number }
  | { type: "skip"; seconds: number }
  | { type: "setPlaybackRate"; playbackRate: PlaybackRate }
  | { type: "mediaEnded" };

export function isTimeInRange(time: number, range: LinePlaybackRange) {
  return time >= range.start && time < range.end;
}

export function isSameLineRange(
  left: LinePlaybackRange | null | undefined,
  right: LinePlaybackRange | null | undefined,
) {
  return Boolean(
    left && right &&
      left.lineId === right.lineId &&
      left.mediaResourceId === right.mediaResourceId &&
      left.mediaSource === right.mediaSource,
  );
}

export function hasPlaybackEnteredRange(
  previousTime: number,
  currentTime: number,
  range: LinePlaybackRange,
) {
  return isTimeInRange(currentTime, range) ||
    (previousTime < range.start && currentTime >= range.start);
}

export function playbackReducer(state: PlaybackState, action: PlaybackAction): PlaybackState {
  switch (action.type) {
    case "hydratePreferences":
      return { ...state, playbackRate: action.playbackRate };
    case "setSource": {
      const sourceChanged = state.mediaSource !== action.mediaSource;
      return {
        ...state,
        mediaResourceId: action.mediaResourceId,
        mediaSource: action.mediaSource,
        currentTime: action.currentTime ?? (sourceChanged ? 0 : state.currentTime),
        duration: sourceChanged ? null : state.duration,
        playing: action.playing ?? state.playing,
        rangeEngaged: sourceChanged ? false : state.rangeEngaged,
        playbackEnded: false,
      };
    }
    case "setPlaying":
      return {
        ...state,
        playing: action.playing,
        playbackEnded: action.playing ? false : state.playbackEnded,
      };
    case "setDuration":
      return { ...state, duration: action.duration };
    case "setCurrentTime":
      return { ...state, currentTime: action.currentTime, playbackEnded: false };
    case "selectedRangeBoundaryReached":
      return {
        ...state,
        currentTime: action.currentTime,
        playing: false,
        playbackEnded: false,
      };
    case "playLine":
      return {
        ...state,
        mediaResourceId: action.range.mediaResourceId,
        mediaSource: action.range.mediaSource,
        currentTime: action.range.start,
        duration: state.mediaSource === action.range.mediaSource ? state.duration : null,
        playing: true,
        rangeEngaged: Boolean(
          state.selectedLineRange &&
            state.selectedLineRange.mediaSource === action.range.mediaSource &&
            isTimeInRange(action.range.start, state.selectedLineRange),
        ),
        playbackEnded: false,
      };
    case "toggleLoop":
      return { ...state, loopEnabled: !state.loopEnabled };
    case "toggleLineLock": {
      if (isSameLineRange(state.selectedLineRange, action.range)) {
        return { ...state, selectedLineRange: null, rangeEngaged: false };
      }
      return {
        ...state,
        selectedLineRange: action.range,
        rangeEngaged: Boolean(
          state.mediaSource === action.range.mediaSource &&
            isTimeInRange(state.currentTime, action.range),
        ),
      };
    }
    case "setRangeEngaged":
      return {
        ...state,
        rangeEngaged: Boolean(action.engaged && state.selectedLineRange),
      };
    case "seek": {
      const rangeEngaged = Boolean(
        state.selectedLineRange &&
          state.selectedLineRange.mediaSource === state.mediaSource &&
          isTimeInRange(action.currentTime, state.selectedLineRange),
      );
      return {
        ...state,
        currentTime: action.currentTime,
        rangeEngaged,
        playbackEnded: false,
      };
    }
    case "skip": {
      if (!state.mediaSource || state.duration == null) return state;
      return playbackReducer(state, {
        type: "seek",
        currentTime: getClampedSkipTime(state.currentTime, action.seconds, state.duration),
      });
    }
    case "setPlaybackRate":
      return { ...state, playbackRate: action.playbackRate };
    case "mediaEnded":
      return {
        ...state,
        playing: false,
        rangeEngaged: false,
        playbackEnded: true,
      };
  }
}

export function getClampedSkipTime(currentTime: number, seconds: number, duration: number) {
  return Math.max(0, Math.min(duration, currentTime + seconds));
}

export function getSelectedRangeToStart(
  state: Pick<PlaybackState, "selectedLineRange" | "rangeEngaged" | "mediaSource" | "currentTime">,
) {
  const selected = state.selectedLineRange;
  if (!selected) return null;
  const canResume = state.rangeEngaged &&
    selected.mediaSource === state.mediaSource &&
    isTimeInRange(state.currentTime, selected);
  return canResume ? null : selected;
}

export type TimeUpdateDecision =
  | { type: "continue" }
  | { type: "pause"; time: number }
  | { type: "loop"; time: number };

export function getTimeUpdateDecision(state: PlaybackState, currentTime: number): TimeUpdateDecision {
  const selected = state.selectedLineRange;
  if (
    selected &&
    state.rangeEngaged &&
    selected.mediaSource === state.mediaSource &&
    currentTime >= selected.end
  ) {
    return state.loopEnabled
      ? { type: "loop", time: selected.start }
      : { type: "pause", time: selected.end };
  }
  return { type: "continue" };
}

export function parseStoredPlaybackRate(value: string | null): PlaybackRate {
  const parsed = Number(value);
  return PLAYBACK_RATES.includes(parsed as PlaybackRate) ? (parsed as PlaybackRate) : 1;
}
