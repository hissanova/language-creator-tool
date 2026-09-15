"use client";

import {
  useCallback,
  useEffect,
  useReducer,
  useRef,
} from "react";
import type { MediaResource } from "../../types/core/document";
import {
  getClampedSkipTime,
  getSelectedRangeToStart,
  initialPlaybackState,
  parseStoredPlaybackRate,
  playbackReducer,
  type LinePlaybackRange,
  type PlaybackAction,
  type PlaybackRate,
} from "./playbackState";
import {
  applyPendingPlayback as applyPendingPlaybackToElement,
  beginPendingSourceTransition,
  handlePlaybackPlayingChange,
  handlePlaybackTimeUpdate,
  type PendingPlayback,
} from "./playbackMediaTransition";

const PLAYBACK_RATE_STORAGE_KEY = "lct.viewer.playbackRate";

export type PlaybackController = ReturnType<typeof usePlaybackController>;

export function dispatchLineLockSelection(
  range: LinePlaybackRange,
  dispatchAction: (action: PlaybackAction) => void,
) {
  dispatchAction({ type: "toggleLineLock", range });
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
      dispatchAndSync({ type: "setPlaying", playing: false });
    });
  }, [dispatchAndSync]);

  const applyPendingPlayback = useCallback(() => {
    const element = mediaElementRef.current;
    applyPendingPlaybackToElement({
      element,
      pendingPlaybackRef,
      playbackRate: stateRef.current.playbackRate,
      dispatchAndSync,
      safelyPlay,
    });
  }, [dispatchAndSync, safelyPlay]);

  const startMediaAt = useCallback((
    mediaResourceId: string,
    mediaSource: string,
    time: number,
  ) => {
    const currentState = stateRef.current;
    const element = mediaElementRef.current;
    const sourceChanged = currentState.mediaSource !== mediaSource;

    if (sourceChanged) {
      beginPendingSourceTransition({
        pendingPlaybackRef,
        pending: { time, play: true },
        commitSourceChange: () => dispatchAndSync({
          type: "setSource",
          mediaResourceId,
          mediaSource,
          currentTime: time,
          playing: true,
        }),
        pauseElement: element ? () => element.pause() : undefined,
      });
      return;
    }

    dispatchAndSync({
      type: "setSource",
      mediaResourceId,
      mediaSource,
      currentTime: time,
      playing: true,
    });
    if (element) {
      element.currentTime = time;
      element.playbackRate = currentState.playbackRate;
      safelyPlay(element);
    }
  }, [dispatchAndSync, safelyPlay]);

  const startLine = useCallback((range: LinePlaybackRange) => {
    const element = mediaElementRef.current;
    const sourceChanged = stateRef.current.mediaSource !== range.mediaSource;
    if (sourceChanged) {
      beginPendingSourceTransition({
        pendingPlaybackRef,
        pending: { time: range.start, play: true, end: range.end },
        commitSourceChange: () => dispatchAndSync({ type: "playLine", range }),
        pauseElement: element ? () => element.pause() : undefined,
      });
      return;
    }
    dispatchAndSync({ type: "playLine", range });
    if (element) {
      element.currentTime = range.start;
      element.playbackRate = stateRef.current.playbackRate;
      safelyPlay(element);
    }
  }, [dispatchAndSync, safelyPlay]);

  const play = useCallback(() => {
    const currentState = stateRef.current;
    const selectedLineRange = getSelectedRangeToStart(currentState);
    if (selectedLineRange) {
      startLine(selectedLineRange);
      return;
    }
    let mediaResourceId = currentState.mediaResourceId;
    let mediaSource = currentState.mediaSource;

    if (!mediaSource || !mediaResourceId) {
      const selected = currentState.selectedLineRange;
      const fallback = audioResources[0];
      mediaResourceId = selected?.mediaResourceId ?? fallback?.id ?? null;
      mediaSource = selected?.mediaSource ?? (fallback ? normalizeSource(fallback.src) : null);
    }
    if (!mediaSource || !mediaResourceId) return;

    const atEnd =
      currentState.duration != null &&
      currentState.currentTime >= currentState.duration;
    const time = atEnd ? 0 : currentState.currentTime;
    startMediaAt(mediaResourceId, mediaSource, time);
  }, [audioResources, normalizeSource, startLine, startMediaAt]);

  const pause = useCallback(() => {
    mediaElementRef.current?.pause();
    dispatchAndSync({ type: "setPlaying", playing: false });
  }, [dispatchAndSync]);

  const seek = useCallback((time: number) => {
    const element = mediaElementRef.current;
    if (element) element.currentTime = time;
    dispatchAndSync({ type: "seek", currentTime: time });
  }, [dispatchAndSync]);

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
    dispatchAndSync({ type: "seek", currentTime });
  }, [dispatchAndSync]);

  const toggleLoop = useCallback(() => {
    dispatchAndSync({ type: "toggleLoop" });
  }, [dispatchAndSync]);
  const toggleLineLock = useCallback((range: LinePlaybackRange) => {
    dispatchLineLockSelection(range, dispatchAndSync);
  }, [dispatchAndSync]);

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
      dispatchAndSync({ type: "setPlaying", playing: false });
      return;
    }
    applyPendingPlayback();
  }, [applyPendingPlayback, dispatchAndSync]);

  const onDurationChange = useCallback(() => {
    const element = mediaElementRef.current;
    if (!element) return;
    dispatchAndSync({
      type: "setDuration",
      duration: Number.isFinite(element.duration) ? element.duration : null,
    });
  }, [dispatchAndSync]);

  const onTimeUpdate = useCallback(() => {
    handlePlaybackTimeUpdate({
      element: mediaElementRef.current,
      pendingPlaybackRef,
      stateRef,
      dispatchAndSync,
    });
  }, [dispatchAndSync]);

  const onPlay = useCallback(() => {
    handlePlaybackPlayingChange({
      playing: true,
      pendingPlaybackRef,
      dispatchAndSync,
    });
  }, [dispatchAndSync]);

  const onPause = useCallback(() => {
    handlePlaybackPlayingChange({
      playing: false,
      pendingPlaybackRef,
      dispatchAndSync,
    });
  }, [dispatchAndSync]);

  const onEnded = useCallback(() => {
    const currentState = stateRef.current;
    const element = mediaElementRef.current;
    const selected = currentState.selectedLineRange;
    if (element && selected && currentState.rangeEngaged && currentState.loopEnabled) {
      element.currentTime = selected.start;
      dispatchAndSync({
        type: "setCurrentTime",
        currentTime: selected.start,
      });
      safelyPlay(element);
      return;
    }
    if (element && selected && currentState.rangeEngaged) {
      element.currentTime = selected.end;
      dispatchAndSync({
        type: "selectedRangeBoundaryReached",
        currentTime: selected.end,
      });
      return;
    }
    if (element && !selected && currentState.loopEnabled) {
      element.currentTime = 0;
      dispatchAndSync({ type: "setCurrentTime", currentTime: 0 });
      safelyPlay(element);
      return;
    }
    dispatchAndSync({ type: "mediaEnded" });
  }, [dispatchAndSync, safelyPlay]);

  return {
    state,
    actions: {
      play,
      pause,
      seek,
      skip,
      playLine: startLine,
      toggleLoop,
      toggleLineLock,
      setPlaybackRate,
    },
    mediaProps: {
      ref: attachMediaElement,
      src: state.mediaSource ?? undefined,
      onLoadedMetadata,
      onDurationChange,
      onTimeUpdate,
      onPlay,
      onPause,
      onEnded,
    },
  };
}
