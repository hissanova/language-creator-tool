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
  continuous: boolean;
  loopEnabled: boolean;
  selectedLoopRange: LinePlaybackRange | null;
  activeLine: LinePlaybackRange | null;
  loopRangeEngaged: boolean;
};

export const initialPlaybackState: PlaybackState = {
  mediaResourceId: null,
  mediaSource: null,
  playing: false,
  currentTime: 0,
  duration: null,
  playbackRate: 1,
  continuous: false,
  loopEnabled: false,
  selectedLoopRange: null,
  activeLine: null,
  loopRangeEngaged: false,
};

export type PlaybackAction =
  | { type: "hydratePreferences"; continuous: boolean; playbackRate: PlaybackRate }
  | { type: "setSource"; mediaResourceId: string; mediaSource: string; currentTime?: number; playing?: boolean }
  | { type: "setPlaying"; playing: boolean }
  | { type: "setDuration"; duration: number | null }
  | { type: "setCurrentTime"; currentTime: number }
  | { type: "lineBoundaryReached"; currentTime: number }
  | { type: "playLine"; range: LinePlaybackRange }
  | { type: "setContinuous"; continuous: boolean }
  | { type: "toggleLoop" }
  | { type: "toggleLineLoop"; range: LinePlaybackRange }
  | { type: "setLoopRangeEngaged"; engaged: boolean }
  | { type: "clearLoopRange" }
  | { type: "seek"; currentTime: number }
  | { type: "skip"; seconds: number }
  | { type: "setPlaybackRate"; playbackRate: PlaybackRate }
  | { type: "mediaEnded" };

export function isTimeInRange(time: number, range: LinePlaybackRange) {
  return time >= range.start && time < range.end;
}

export function hasPlaybackEnteredRange(
  previousTime: number,
  currentTime: number,
  range: LinePlaybackRange,
) {
  return (
    isTimeInRange(currentTime, range) ||
    (previousTime < range.start && currentTime >= range.start)
  );
}

export function playbackReducer(
  state: PlaybackState,
  action: PlaybackAction,
): PlaybackState {
  switch (action.type) {
    case "hydratePreferences":
      return {
        ...state,
        continuous: action.continuous,
        playbackRate: action.playbackRate,
      };
    case "setSource": {
      const sourceChanged = state.mediaSource !== action.mediaSource;
      return {
        ...state,
        mediaResourceId: action.mediaResourceId,
        mediaSource: action.mediaSource,
        currentTime: action.currentTime ?? (sourceChanged ? 0 : state.currentTime),
        duration: sourceChanged ? null : state.duration,
        playing: action.playing ?? state.playing,
        activeLine: sourceChanged ? null : state.activeLine,
        loopRangeEngaged: sourceChanged ? false : state.loopRangeEngaged,
      };
    }
    case "setPlaying":
      return { ...state, playing: action.playing };
    case "setDuration":
      return { ...state, duration: action.duration };
    case "setCurrentTime":
      return { ...state, currentTime: action.currentTime };
    case "lineBoundaryReached":
      return {
        ...state,
        currentTime: action.currentTime,
        playing: false,
        activeLine: null,
      };
    case "playLine":
      return {
        ...state,
        mediaResourceId: action.range.mediaResourceId,
        mediaSource: action.range.mediaSource,
        currentTime: action.range.start,
        duration:
          state.mediaSource === action.range.mediaSource ? state.duration : null,
        playing: true,
        activeLine: action.range,
        loopRangeEngaged: Boolean(
          state.loopEnabled &&
            state.selectedLoopRange?.lineId === action.range.lineId,
        ),
      };
    case "setContinuous":
      return { ...state, continuous: action.continuous };
    case "toggleLoop": {
      const loopEnabled = !state.loopEnabled;
      const selected = state.selectedLoopRange;
      const loopRangeEngaged = Boolean(
        loopEnabled &&
          selected &&
          selected.mediaSource === state.mediaSource &&
          isTimeInRange(state.currentTime, selected),
      );
      return {
        ...state,
        loopEnabled,
        loopRangeEngaged,
        activeLine: loopRangeEngaged && selected ? selected : state.activeLine,
      };
    }
    case "toggleLineLoop": {
      const isSelected = state.selectedLoopRange?.lineId === action.range.lineId;
      if (isSelected) {
        return {
          ...state,
          loopEnabled: false,
          selectedLoopRange: null,
          loopRangeEngaged: false,
        };
      }

      const loopRangeEngaged = Boolean(
        state.mediaSource === action.range.mediaSource &&
          isTimeInRange(state.currentTime, action.range),
      );
      return {
        ...state,
        loopEnabled: true,
        selectedLoopRange: action.range,
        loopRangeEngaged,
        activeLine: loopRangeEngaged ? action.range : state.activeLine,
      };
    }
    case "setLoopRangeEngaged":
      return {
        ...state,
        loopRangeEngaged: action.engaged,
        activeLine:
          action.engaged && state.selectedLoopRange
            ? state.selectedLoopRange
            : state.activeLine,
      };
    case "clearLoopRange":
      return {
        ...state,
        loopEnabled: false,
        selectedLoopRange: null,
        loopRangeEngaged: false,
      };
    case "seek": {
      const selected = state.selectedLoopRange;
      const insideSelectedRange = Boolean(
        selected &&
          selected.mediaSource === state.mediaSource &&
          isTimeInRange(action.currentTime, selected),
      );
      return {
        ...state,
        currentTime: action.currentTime,
        loopEnabled:
          state.loopEnabled && selected && !insideSelectedRange
            ? false
            : state.loopEnabled,
        loopRangeEngaged: Boolean(state.loopEnabled && insideSelectedRange),
      };
    }
    case "skip": {
      if (!state.mediaSource || state.duration == null) return state;
      const currentTime = getClampedSkipTime(
        state.currentTime,
        action.seconds,
        state.duration,
      );
      return playbackReducer(state, { type: "seek", currentTime });
    }
    case "setPlaybackRate":
      return { ...state, playbackRate: action.playbackRate };
    case "mediaEnded":
      return { ...state, playing: false, activeLine: null };
  }
}

export function getClampedSkipTime(
  currentTime: number,
  seconds: number,
  duration: number,
) {
  return Math.max(0, Math.min(duration, currentTime + seconds));
}

export function getSelectedLoopRangeToStart(
  state: Pick<
    PlaybackState,
    | "loopEnabled"
    | "selectedLoopRange"
    | "loopRangeEngaged"
    | "mediaSource"
    | "currentTime"
  >,
) {
  const selected = state.selectedLoopRange;
  if (!state.loopEnabled || !selected) return null;

  const canResumeEngagedRange =
    state.loopRangeEngaged &&
    selected.mediaSource === state.mediaSource &&
    isTimeInRange(state.currentTime, selected);

  return canResumeEngagedRange ? null : selected;
}

export type TimeUpdateDecision =
  | { type: "continue" }
  | { type: "pause"; time: number }
  | { type: "loop"; time: number };

export function getTimeUpdateDecision(
  state: PlaybackState,
  currentTime: number,
): TimeUpdateDecision {
  const selected = state.selectedLoopRange;

  if (
    state.loopEnabled &&
    selected &&
    state.loopRangeEngaged &&
    selected.mediaSource === state.mediaSource &&
    currentTime >= selected.end
  ) {
    return { type: "loop", time: selected.start };
  }

  if (
    state.activeLine &&
    state.activeLine.mediaSource === state.mediaSource &&
    !state.continuous &&
    !(state.loopEnabled && !selected) &&
    currentTime >= state.activeLine.end
  ) {
    return { type: "pause", time: state.activeLine.end };
  }

  return { type: "continue" };
}

export function parseStoredPlaybackRate(value: string | null): PlaybackRate {
  const parsed = Number(value);
  return PLAYBACK_RATES.includes(parsed as PlaybackRate)
    ? (parsed as PlaybackRate)
    : 1;
}

export function parseStoredContinuous(value: string | null) {
  return value === "true";
}
