import {
  getSelectedRangeToStart,
  getTimeUpdateDecision,
  hasPlaybackEnteredRange,
  playbackReducer,
  type LinePlaybackRange,
  type PlaybackAction,
  type PlaybackRate,
  type PlaybackState,
} from "./playbackState";

/** Held across a source change until metadata makes the requested seek safe. */
export type PendingPlayback = { readonly time: number; readonly end?: number };

export type PlaybackInstruction = Readonly<
  | { type: "dispatch"; action: PlaybackAction }
  | { type: "setPending"; pending: PendingPlayback | null }
  | { type: "seekMedia"; time: number }
  | { type: "setMediaPlaybackRate"; playbackRate: PlaybackRate }
  | { type: "persistPlaybackRate"; playbackRate: PlaybackRate }
  | { type: "playMedia" }
  | { type: "pauseMedia" }
  | { type: "warn"; message: string }>;

export function planPlaybackStart(input: {
  sourceChanged: boolean;
  action: PlaybackAction;
  pending: PendingPlayback;
  playbackRate: PlaybackRate;
}): PlaybackInstruction[] {
  const { sourceChanged, action, pending, playbackRate } = input;
  return sourceChanged
    ? [{ type: "setPending", pending }, { type: "dispatch", action }, { type: "pauseMedia" }]
    : [{ type: "dispatch", action }, { type: "seekMedia", time: pending.time },
      { type: "setMediaPlaybackRate", playbackRate }, { type: "playMedia" }];
}

export function planLinePlay(state: PlaybackState, range: LinePlaybackRange): PlaybackInstruction[] {
  return planPlaybackStart({
    sourceChanged: state.mediaSource !== range.mediaSource,
    action: { type: "playLine", range },
    pending: { time: range.start, end: range.end },
    playbackRate: state.playbackRate,
  });
}

export function planGlobalPlay(
  state: PlaybackState,
  fallback?: { mediaResourceId: string; mediaSource: string },
): PlaybackInstruction[] {
  const selectedLineRange = getSelectedRangeToStart(state);
  if (selectedLineRange) return planLinePlay(state, selectedLineRange);
  const needsFallback = !state.mediaSource || !state.mediaResourceId;
  const mediaResourceId = needsFallback
    ? state.selectedLineRange?.mediaResourceId ?? fallback?.mediaResourceId
    : state.mediaResourceId;
  const mediaSource = needsFallback
    ? state.selectedLineRange?.mediaSource ?? fallback?.mediaSource
    : state.mediaSource;
  if (!mediaResourceId || !mediaSource) return [];
  const atEnd = state.duration != null && state.currentTime >= state.duration;
  const time = atEnd ? 0 : state.currentTime;
  return planPlaybackStart({
    sourceChanged: state.mediaSource !== mediaSource,
    action: { type: "setSource", mediaResourceId, mediaSource, currentTime: time, playing: true },
    pending: { time }, playbackRate: state.playbackRate,
  });
}

export function planPendingPlayback(pending: PendingPlayback | null, playbackRate: PlaybackRate): PlaybackInstruction[] {
  if (!pending) return [];
  return [
    { type: "seekMedia", time: pending.time },
    { type: "dispatch", action: { type: "setCurrentTime", currentTime: pending.time } },
    { type: "setMediaPlaybackRate", playbackRate },
    { type: "setPending", pending: null },
    { type: "playMedia" },
  ];
}

export function planTimeUpdate(state: PlaybackState, pending: PendingPlayback | null, currentTime: number): PlaybackInstruction[] {
  if (pending) return [];
  const instructions: PlaybackInstruction[] = [];
  let decisionState = state;
  const selected = state.selectedLineRange;
  if (selected && !state.rangeEngaged && selected.mediaSource === state.mediaSource &&
      hasPlaybackEnteredRange(state.currentTime, currentTime, selected)) {
    const action: PlaybackAction = { type: "setRangeEngaged", engaged: true };
    instructions.push({ type: "dispatch", action });
    decisionState = playbackReducer(state, action);
  }
  const decision = getTimeUpdateDecision(decisionState, currentTime);
  if (decision.type === "loop") {
    return [...instructions, { type: "seekMedia", time: decision.time },
      { type: "dispatch", action: { type: "setCurrentTime", currentTime: decision.time } }];
  }
  if (decision.type === "pause") {
    return [...instructions, { type: "seekMedia", time: decision.time }, { type: "pauseMedia" },
      { type: "dispatch", action: { type: "selectedRangeBoundaryReached", currentTime: decision.time } }];
  }
  return [...instructions, { type: "dispatch", action: { type: "setCurrentTime", currentTime } }];
}

export function planPlayingChange(playing: boolean, pending: PendingPlayback | null): PlaybackInstruction[] {
  return !playing && pending ? [] : [{ type: "dispatch", action: { type: "setPlaying", playing } }];
}

export function planDuration(duration: number): PlaybackInstruction[] {
  return [{ type: "dispatch", action: { type: "setDuration", duration: Number.isFinite(duration) ? duration : null } }];
}

export function planLoadedMetadata(duration: number, pending: PendingPlayback | null, playbackRate: PlaybackRate): PlaybackInstruction[] {
  const normalized = Number.isFinite(duration) ? duration : null;
  const instructions = planDuration(duration);
  if (normalized != null && pending?.end != null && pending.end > normalized) {
    return [...instructions,
      { type: "warn", message: "Playback disabled: line timestamp exceeds the media duration." },
      { type: "setPending", pending: null }, { type: "pauseMedia" },
      { type: "dispatch", action: { type: "setPlaying", playing: false } }];
  }
  return [...instructions, ...planPendingPlayback(pending, playbackRate)];
}

export function planMediaEnded(state: PlaybackState, hasMediaElement: boolean): PlaybackInstruction[] {
  const selected = state.selectedLineRange;
  if (hasMediaElement && selected && state.rangeEngaged) {
    const time = state.loopEnabled ? selected.start : selected.end;
    return [{ type: "seekMedia", time },
      { type: "dispatch", action: state.loopEnabled
        ? { type: "setCurrentTime", currentTime: time }
        : { type: "selectedRangeBoundaryReached", currentTime: time } },
      ...(state.loopEnabled ? [{ type: "playMedia" } as const] : [])];
  }
  if (hasMediaElement && !selected && state.loopEnabled) {
    return [{ type: "seekMedia", time: 0 },
      { type: "dispatch", action: { type: "setCurrentTime", currentTime: 0 } },
      { type: "playMedia" }];
  }
  return [{ type: "dispatch", action: { type: "mediaEnded" } }];
}
