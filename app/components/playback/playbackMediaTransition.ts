import {
  getTimeUpdateDecision,
  hasPlaybackEnteredRange,
  type PlaybackAction,
  type PlaybackRate,
  type PlaybackState,
} from "./playbackState";

export type PendingPlayback = {
  time: number;
  end?: number;
};

export type MutablePlaybackRef<T> = {
  current: T;
};

type DispatchAndSync = (action: PlaybackAction) => void;

export function beginPendingSourceTransition({
  pendingPlaybackRef,
  pending,
  commitSourceChange,
  pauseElement,
}: {
  pendingPlaybackRef: MutablePlaybackRef<PendingPlayback | null>;
  pending: PendingPlayback;
  commitSourceChange: () => void;
  pauseElement: (() => void) | undefined;
}) {
  pendingPlaybackRef.current = pending;
  commitSourceChange();
  pauseElement?.();
}

export function applyPendingPlayback({
  element,
  pendingPlaybackRef,
  playbackRate,
  dispatchAndSync,
  safelyPlay,
}: {
  element: HTMLMediaElement | null;
  pendingPlaybackRef: MutablePlaybackRef<PendingPlayback | null>;
  playbackRate: PlaybackRate;
  dispatchAndSync: DispatchAndSync;
  safelyPlay: (element: HTMLMediaElement) => void;
}) {
  const pending = pendingPlaybackRef.current;
  if (!element || !pending) return;

  element.currentTime = pending.time;
  dispatchAndSync({ type: "setCurrentTime", currentTime: pending.time });
  element.playbackRate = playbackRate;
  pendingPlaybackRef.current = null;
  safelyPlay(element);
}

export function handlePlaybackTimeUpdate({
  element,
  pendingPlaybackRef,
  stateRef,
  dispatchAndSync,
}: {
  element: HTMLMediaElement | null;
  pendingPlaybackRef: MutablePlaybackRef<PendingPlayback | null>;
  stateRef: MutablePlaybackRef<PlaybackState>;
  dispatchAndSync: DispatchAndSync;
}) {
  if (!element || pendingPlaybackRef.current) return;

  const currentState = stateRef.current;
  const currentTime = element.currentTime;
  const selected = currentState.selectedLineRange;
  if (
    selected &&
    !currentState.rangeEngaged &&
    selected.mediaSource === currentState.mediaSource &&
    hasPlaybackEnteredRange(currentState.currentTime, currentTime, selected)
  ) {
    dispatchAndSync({ type: "setRangeEngaged", engaged: true });
  }
  const decision = getTimeUpdateDecision(stateRef.current, currentTime);
  if (decision.type === "loop") {
    element.currentTime = decision.time;
    dispatchAndSync({ type: "setCurrentTime", currentTime: decision.time });
    return;
  }
  if (decision.type === "pause") {
    element.currentTime = decision.time;
    element.pause();
    dispatchAndSync({ type: "selectedRangeBoundaryReached", currentTime: decision.time });
    return;
  }
  dispatchAndSync({ type: "setCurrentTime", currentTime });
}

export function handlePlaybackPlayingChange({
  playing,
  pendingPlaybackRef,
  dispatchAndSync,
}: {
  playing: boolean;
  pendingPlaybackRef: MutablePlaybackRef<PendingPlayback | null>;
  dispatchAndSync: DispatchAndSync;
}) {
  if (!playing && pendingPlaybackRef.current) return;
  dispatchAndSync({ type: "setPlaying", playing });
}

export function handlePlaybackEnded({
  element,
  stateRef,
  dispatchAndSync,
  safelyPlay,
}: {
  element: HTMLMediaElement | null;
  stateRef: MutablePlaybackRef<PlaybackState>;
  dispatchAndSync: DispatchAndSync;
  safelyPlay: (element: HTMLMediaElement) => void;
}) {
  const currentState = stateRef.current;
  const selected = currentState.selectedLineRange;
  if (element && selected && currentState.rangeEngaged && currentState.loopEnabled) {
    element.currentTime = selected.start;
    dispatchAndSync({ type: "setCurrentTime", currentTime: selected.start });
    safelyPlay(element);
    return;
  }
  if (element && selected && currentState.rangeEngaged) {
    element.currentTime = selected.end;
    dispatchAndSync({ type: "selectedRangeBoundaryReached", currentTime: selected.end });
    return;
  }
  if (element && !selected && currentState.loopEnabled) {
    element.currentTime = 0;
    dispatchAndSync({ type: "setCurrentTime", currentTime: 0 });
    safelyPlay(element);
    return;
  }
  dispatchAndSync({ type: "mediaEnded" });
}
