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
  initialPlaybackState,
  parseStoredPlaybackRate,
  playbackReducer,
  type LinePlaybackRange,
  type PlaybackAction,
  type PlaybackRate,
} from "./playbackState";
import {
  planLinePlay, planGlobalPlay, planPlayingChange, planTimeUpdate, planLoadedMetadata,
  planDuration, planMediaEnded, type PendingPlayback, type PlaybackInstruction,
} from "./playbackMediaPlan";
import { executePlaybackInstructions, PLAYBACK_RATE_STORAGE_KEY } from "./playbackMediaAdapter";

export type PlaybackController = ReturnType<typeof usePlaybackController>;

export function usePlaybackController(
  audioResources: MediaResource[],
  normalizeSource: (source: string) => string,
) {
  const [state, dispatch] = useReducer(playbackReducer, initialPlaybackState);
  const mediaElementRef = useRef<HTMLMediaElement | null>(null);
  const stateRef = useRef(state);
  /**
   * Lock only selects a range; rangeEngaged says that range currently owns the
   * playback boundary. Source changes stay pending until metadata permits the
   * requested seek, so pre-seek time/pause events cannot replace logical state.
   * Global Loop applies to the locked range when present, otherwise the source.
   * Auto-follow observes this state and never controls playback.
   */
  const pendingPlaybackRef = useRef<PendingPlayback | null>(null);

  const dispatchAndSync = useCallback((action: PlaybackAction) => {
    stateRef.current = playbackReducer(stateRef.current, action);
    dispatch(action);
  }, []);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    dispatchAndSync({
      type: "hydratePreferences",
      playbackRate: parseStoredPlaybackRate(localStorage.getItem(PLAYBACK_RATE_STORAGE_KEY)),
    });
  }, [dispatchAndSync]);

  const execute = useCallback((instructions: readonly PlaybackInstruction[]) => {
    executePlaybackInstructions(instructions, {
      element: mediaElementRef.current,
      pendingPlaybackRef,
      dispatchAndSync,
    });
  }, [dispatchAndSync]);

  useEffect(() => {
    execute([{ type: "setMediaPlaybackRate", playbackRate: state.playbackRate }]);
  }, [execute, state.playbackRate]);

  useEffect(() => () => {
    execute([{ type: "setPending", pending: null }, { type: "pauseMedia" }]);
  }, [execute]);

  const startLine = useCallback((range: LinePlaybackRange) => {
    execute(planLinePlay(stateRef.current, range));
  }, [execute]);

  const play = useCallback(() => {
    const fallback = audioResources[0];
    execute(planGlobalPlay(stateRef.current, fallback ? {
      mediaResourceId: fallback.id,
      mediaSource: normalizeSource(fallback.src),
    } : undefined));
  }, [audioResources, normalizeSource, execute]);

  const pause = useCallback(() => {
    execute([{ type: "pauseMedia" }, { type: "dispatch", action: { type: "setPlaying", playing: false } }]);
  }, [execute]);

  const seek = useCallback((time: number) => {
    execute([{ type: "seekMedia", time }, { type: "dispatch", action: { type: "seek", currentTime: time } }]);
  }, [execute]);

  const skip = useCallback((seconds: number) => {
    const currentState = stateRef.current;
    if (!currentState.mediaSource || currentState.duration == null) return;

    const element = mediaElementRef.current;
    const currentTime = getClampedSkipTime(
      element?.currentTime ?? currentState.currentTime,
      seconds,
      currentState.duration,
    );
    execute([{ type: "seekMedia", time: currentTime }, { type: "dispatch", action: { type: "seek", currentTime } }]);
  }, [execute]);

  const toggleLoop = useCallback(() => {
    dispatchAndSync({ type: "toggleLoop" });
  }, [dispatchAndSync]);
  const toggleLineLock = useCallback((range: LinePlaybackRange) => {
    dispatchAndSync({ type: "toggleLineLock", range });
  }, [dispatchAndSync]);

  const setPlaybackRate = useCallback((playbackRate: PlaybackRate) => {
    execute([
      { type: "persistPlaybackRate", playbackRate },
      { type: "dispatch", action: { type: "setPlaybackRate", playbackRate } },
    ]);
  }, [execute]);

  const attachMediaElement = useCallback((element: HTMLMediaElement | null) => {
    if (!element && mediaElementRef.current) execute([{ type: "pauseMedia" }]);
    mediaElementRef.current = element;
  }, [execute]);

  const onLoadedMetadata = useCallback(() => {
    const element = mediaElementRef.current;
    if (!element) return;
    execute(planLoadedMetadata(element.duration, pendingPlaybackRef.current, stateRef.current.playbackRate));
  }, [execute]);

  const onDurationChange = useCallback(() => {
    const element = mediaElementRef.current;
    if (!element) return;
    execute(planDuration(element.duration));
  }, [execute]);

  const onTimeUpdate = useCallback(() => {
    const element = mediaElementRef.current;
    if (!element) return;
    execute(planTimeUpdate(stateRef.current, pendingPlaybackRef.current, element.currentTime));
  }, [execute]);

  const onPlay = useCallback(() => {
    execute(planPlayingChange(true, pendingPlaybackRef.current));
  }, [execute]);

  const onPause = useCallback(() => {
    execute(planPlayingChange(false, pendingPlaybackRef.current));
  }, [execute]);

  const onEnded = useCallback(() => {
    execute(planMediaEnded(stateRef.current, Boolean(mediaElementRef.current)));
  }, [execute]);

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
