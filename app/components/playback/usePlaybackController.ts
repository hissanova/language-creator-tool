"use client";

import {
  useCallback,
  useEffect,
  useReducer,
  useRef,
} from "react";
import type { MediaResource } from "../../types/core/document";
import {
  getTimeUpdateDecision,
  getClampedSkipTime,
  getSelectedLoopRangeToStart,
  hasPlaybackEnteredRange,
  initialPlaybackState,
  parseStoredContinuous,
  parseStoredPlaybackRate,
  playbackReducer,
  type LinePlaybackRange,
  type PlaybackAction,
  type PlaybackRate,
} from "./playbackState";

const CONTINUOUS_STORAGE_KEY = "lct.viewer.continuous";
const PLAYBACK_RATE_STORAGE_KEY = "lct.viewer.playbackRate";

type PendingPlayback = {
  time: number;
  play: boolean;
  end?: number;
};

export type PlaybackController = ReturnType<typeof usePlaybackController>;

export function dispatchLineLoopSelection(
  range: LinePlaybackRange,
  dispatchAction: (action: PlaybackAction) => void,
) {
  dispatchAction({ type: "toggleLineLoop", range });
}

export function usePlaybackController(
  audioResources: MediaResource[],
  normalizeSource: (source: string) => string,
) {
  const [state, dispatch] = useReducer(playbackReducer, initialPlaybackState);
  const mediaElementRef = useRef<HTMLMediaElement | null>(null);
  const stateRef = useRef(state);
  const pendingPlaybackRef = useRef<PendingPlayback | null>(null);

  const dispatchAndSync = useCallback((action: PlaybackAction) => {
    stateRef.current = playbackReducer(stateRef.current, action);
    dispatch(action);
  }, []);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    dispatch({
      type: "hydratePreferences",
      continuous: parseStoredContinuous(localStorage.getItem(CONTINUOUS_STORAGE_KEY)),
      playbackRate: parseStoredPlaybackRate(localStorage.getItem(PLAYBACK_RATE_STORAGE_KEY)),
    });
  }, []);

  useEffect(() => {
    const element = mediaElementRef.current;
    if (element) element.playbackRate = state.playbackRate;
  }, [state.playbackRate]);

  useEffect(() => () => {
    pendingPlaybackRef.current = null;
    mediaElementRef.current?.pause();
  }, []);

  const safelyPlay = useCallback((element: HTMLMediaElement) => {
    void element.play().catch(() => {
      dispatch({ type: "setPlaying", playing: false });
    });
  }, []);

  const applyPendingPlayback = useCallback(() => {
    const element = mediaElementRef.current;
    const pending = pendingPlaybackRef.current;
    if (!element || !pending) return;

    element.currentTime = pending.time;
    element.playbackRate = stateRef.current.playbackRate;
    pendingPlaybackRef.current = null;
    if (pending.play) safelyPlay(element);
  }, [safelyPlay]);

  const beginAt = useCallback((
    mediaResourceId: string,
    mediaSource: string,
    time: number,
    range?: LinePlaybackRange,
  ) => {
    const currentState = stateRef.current;
    const element = mediaElementRef.current;
    const sourceChanged = currentState.mediaSource !== mediaSource;

    if (sourceChanged) {
      element?.pause();
      pendingPlaybackRef.current = { time, play: true, end: range?.end };
    }

    if (range) {
      dispatchAndSync({ type: "playLine", range });
    } else {
      dispatchAndSync({
        type: "setSource",
        mediaResourceId,
        mediaSource,
        currentTime: time,
        playing: true,
      });
    }

    if (!sourceChanged && element) {
      element.currentTime = time;
      element.playbackRate = currentState.playbackRate;
      safelyPlay(element);
    }
  }, [dispatchAndSync, safelyPlay]);

  const play = useCallback(() => {
    const currentState = stateRef.current;
    const selectedLoopRange = getSelectedLoopRangeToStart(currentState);
    if (selectedLoopRange) {
      beginAt(
        selectedLoopRange.mediaResourceId,
        selectedLoopRange.mediaSource,
        selectedLoopRange.start,
        selectedLoopRange,
      );
      return;
    }
    let mediaResourceId = currentState.mediaResourceId;
    let mediaSource = currentState.mediaSource;

    if (!mediaSource || !mediaResourceId) {
      const selected = currentState.selectedLoopRange;
      const fallback = audioResources[0];
      mediaResourceId = selected?.mediaResourceId ?? fallback?.id ?? null;
      mediaSource = selected?.mediaSource ?? (fallback ? normalizeSource(fallback.src) : null);
    }
    if (!mediaSource || !mediaResourceId) return;

    const atEnd =
      currentState.duration != null &&
      currentState.currentTime >= currentState.duration;
    const time = atEnd ? 0 : currentState.currentTime;
    beginAt(mediaResourceId, mediaSource, time);
  }, [audioResources, beginAt, normalizeSource]);

  const pause = useCallback(() => {
    mediaElementRef.current?.pause();
    dispatchAndSync({ type: "setPlaying", playing: false });
  }, [dispatchAndSync]);

  const playLine = useCallback((range: LinePlaybackRange) => {
    beginAt(range.mediaResourceId, range.mediaSource, range.start, range);
  }, [beginAt]);

  const seek = useCallback((time: number) => {
    const element = mediaElementRef.current;
    if (element) element.currentTime = time;
    dispatch({ type: "seek", currentTime: time });
  }, []);

  const skip = useCallback((seconds: number) => {
    const currentState = stateRef.current;
    if (!currentState.mediaSource || currentState.duration == null) return;

    const element = mediaElementRef.current;
    const currentTime = getClampedSkipTime(
      element?.currentTime ?? currentState.currentTime,
      seconds,
      currentState.duration,
    );
    if (element) element.currentTime = currentTime;
    dispatch({ type: "seek", currentTime });
  }, []);

  const setContinuous = useCallback((continuous: boolean) => {
    localStorage.setItem(CONTINUOUS_STORAGE_KEY, String(continuous));
    dispatch({ type: "setContinuous", continuous });
  }, []);

  const toggleLoop = useCallback(() => dispatch({ type: "toggleLoop" }), []);
  const toggleLineLoop = useCallback((range: LinePlaybackRange) => {
    dispatchLineLoopSelection(range, dispatchAndSync);
  }, [dispatchAndSync]);
  const clearLoopRange = useCallback(() => dispatch({ type: "clearLoopRange" }), []);

  const setPlaybackRate = useCallback((playbackRate: PlaybackRate) => {
    localStorage.setItem(PLAYBACK_RATE_STORAGE_KEY, String(playbackRate));
    dispatch({ type: "setPlaybackRate", playbackRate });
  }, []);

  const attachMediaElement = useCallback((element: HTMLMediaElement | null) => {
    if (!element && mediaElementRef.current) mediaElementRef.current.pause();
    mediaElementRef.current = element;
  }, []);

  const onLoadedMetadata = useCallback(() => {
    const element = mediaElementRef.current;
    if (!element) return;
    const duration = Number.isFinite(element.duration) ? element.duration : null;
    dispatch({
      type: "setDuration",
      duration,
    });
    const pending = pendingPlaybackRef.current;
    if (duration != null && pending?.end != null && pending.end > duration) {
      console.warn("Playback disabled: line timestamp exceeds the media duration.");
      pendingPlaybackRef.current = null;
      element.pause();
      dispatch({ type: "setPlaying", playing: false });
      return;
    }
    applyPendingPlayback();
  }, [applyPendingPlayback]);

  const onDurationChange = useCallback(() => {
    const element = mediaElementRef.current;
    if (!element) return;
    dispatch({
      type: "setDuration",
      duration: Number.isFinite(element.duration) ? element.duration : null,
    });
  }, []);

  const onTimeUpdate = useCallback(() => {
    const element = mediaElementRef.current;
    if (!element) return;
    const currentState = stateRef.current;
    const currentTime = element.currentTime;
    const selected = currentState.selectedLoopRange;

    if (
      currentState.loopEnabled &&
      selected &&
      !currentState.loopRangeEngaged &&
      selected.mediaSource === currentState.mediaSource &&
      hasPlaybackEnteredRange(currentState.currentTime, currentTime, selected)
    ) {
      dispatchAndSync({ type: "setLoopRangeEngaged", engaged: true });
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
      dispatchAndSync({ type: "lineBoundaryReached", currentTime: decision.time });
      return;
    }
    dispatchAndSync({ type: "setCurrentTime", currentTime });
  }, [dispatchAndSync]);

  const onEnded = useCallback(() => {
    const currentState = stateRef.current;
    const element = mediaElementRef.current;
    if (element && currentState.loopEnabled && !currentState.selectedLoopRange) {
      element.currentTime = 0;
      dispatch({ type: "setCurrentTime", currentTime: 0 });
      safelyPlay(element);
      return;
    }
    dispatch({ type: "mediaEnded" });
  }, [safelyPlay]);

  return {
    state,
    actions: {
      play,
      pause,
      seek,
      skip,
      playLine,
      setContinuous,
      toggleLoop,
      toggleLineLoop,
      clearLoopRange,
      setPlaybackRate,
    },
    mediaProps: {
      ref: attachMediaElement,
      src: state.mediaSource ?? undefined,
      onLoadedMetadata,
      onDurationChange,
      onTimeUpdate,
      onPlay: () => dispatch({ type: "setPlaying", playing: true }),
      onPause: () => dispatch({ type: "setPlaying", playing: false }),
      onEnded,
    },
  };
}
