"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef } from "react";
import {
  AUTO_FOLLOW_PROGRAMMATIC_SCROLL_TIMEOUT_MS,
  getAutoFollowScrollBehavior,
  getAutoFollowSafeRegion,
  getUsableViewport,
  isLineWithinRegion,
  isManualAutoFollowKey,
  resolveAutoFollowScrollTarget,
  shouldIgnoreProgrammaticScroll,
  type AutoFollowMode,
  type ProgrammaticScroll,
} from "./autoFollow";
import {
  initialAutoFollowState,
  reduceAutoFollow,
  type AutoFollowObservation,
} from "./autoFollowState";

type LineElementRegistry = {
  elements: Map<string, HTMLElement>;
  register: (lineId: string) => (element: HTMLDivElement | null) => void;
};

function createLineElementRegistry(): LineElementRegistry {
  const elements = new Map<string, HTMLElement>();
  const callbacks = new Map<string, (element: HTMLDivElement | null) => void>();

  return {
    elements,
    register(lineId) {
      const existing = callbacks.get(lineId);
      if (existing) return existing;

      const callback = (element: HTMLDivElement | null) => {
        if (element) elements.set(lineId, element);
        else elements.delete(lineId);
      };
      callbacks.set(lineId, callback);
      return callback;
    },
  };
}

export function useActiveLineAutoFollow({
  documentToken,
  sourceToken,
  currentLineId,
  playbackPosition,
  playing,
}: AutoFollowObservation) {
  const [state, dispatch] = useReducer(reduceAutoFollow, initialAutoFollowState);
  const stickyControlsElementRef = useRef<HTMLDivElement | null>(null);
  const programmaticScrollRef = useRef<ProgrammaticScroll | null>(null);
  const programmaticScrollTimerRef = useRef<number | null>(null);

  const registry = useMemo(() => {
    void documentToken;
    void sourceToken;
    return createLineElementRegistry();
  }, [documentToken, sourceToken]);

  const registerStickyControls = useCallback((element: HTMLDivElement | null) => {
    stickyControlsElementRef.current = element;
  }, []);

  const clearProgrammaticScroll = useCallback(() => {
    programmaticScrollRef.current = null;
    if (programmaticScrollTimerRef.current != null) {
      window.clearTimeout(programmaticScrollTimerRef.current);
      programmaticScrollTimerRef.current = null;
    }
  }, []);

  const setEnabled = useCallback((enabled: boolean) => {
    if (!enabled) clearProgrammaticScroll();
    dispatch({ type: "enabledChanged", enabled });
  }, [clearProgrammaticScroll]);

  const setMode = useCallback((mode: AutoFollowMode) => {
    dispatch({ type: "modeChanged", mode });
  }, []);

  const requestFollow = useCallback(() => {
    dispatch({ type: "followRequested" });
  }, []);

  const getCurrentGeometry = useCallback((lineId: string | null) => {
    const lineElement = lineId ? registry.elements.get(lineId) : undefined;
    if (!lineElement?.isConnected) return null;

    const lineRect = lineElement.getBoundingClientRect();
    const stickyRect = stickyControlsElementRef.current?.getBoundingClientRect() ?? null;
    const usableViewport = getUsableViewport(window.innerHeight, stickyRect);
    return { lineRect, usableViewport };
  }, [registry]);

  useEffect(() => {
    dispatch({
      type: "playbackObserved",
      observation: { documentToken, sourceToken, currentLineId, playbackPosition, playing },
    });
  }, [documentToken, sourceToken, currentLineId, playbackPosition, playing]);

  useEffect(() => {
    if (
      state.followRevision === 0 ||
      !state.enabled ||
      state.suspension.type === "manual" ||
      !state.playback?.playing
    ) return;
    const lineId = state.playback?.currentLineId ?? null;
    const geometry = getCurrentGeometry(lineId);
    if (!geometry) return;

    const targetY = resolveAutoFollowScrollTarget({
      mode: state.mode,
      lineRect: geometry.lineRect,
      usableViewport: geometry.usableViewport,
      currentScrollY: window.scrollY,
    });
    if (targetY == null) return;

    clearProgrammaticScroll();
    programmaticScrollRef.current = {
      targetY,
      expiresAt: Date.now() + AUTO_FOLLOW_PROGRAMMATIC_SCROLL_TIMEOUT_MS,
    };
    programmaticScrollTimerRef.current = window.setTimeout(
      clearProgrammaticScroll,
      AUTO_FOLLOW_PROGRAMMATIC_SCROLL_TIMEOUT_MS,
    );
    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    window.scrollTo({
      top: targetY,
      behavior: getAutoFollowScrollBehavior(reducedMotion),
    });
    // Each revision is one scroll command; unrelated state changes must not replay it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.followRevision]);

  useEffect(() => {
    const suspendForManualIntent = () => {
      clearProgrammaticScroll();
      dispatch({ type: "manualScrollIntent" });
    };

    const onKeyDown = (event: KeyboardEvent) => {
      queueMicrotask(() => {
        if (isManualAutoFollowKey(event)) suspendForManualIntent();
      });
    };

    const onScroll = () => {
      const programmaticScroll = programmaticScrollRef.current;
      if (shouldIgnoreProgrammaticScroll(programmaticScroll, Date.now())) return;
      if (programmaticScroll) clearProgrammaticScroll();

      const geometry = getCurrentGeometry(currentLineId);
      if (!geometry) return;
      dispatch({
        type: "manualScrollObserved",
        lineWithinSafeRegion: isLineWithinRegion(
          geometry.lineRect,
          getAutoFollowSafeRegion(geometry.usableViewport),
        ),
      });
    };

    window.addEventListener("wheel", suspendForManualIntent, { passive: true });
    window.addEventListener("touchmove", suspendForManualIntent, { passive: true });
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("scrollend", clearProgrammaticScroll);
    return () => {
      window.removeEventListener("wheel", suspendForManualIntent);
      window.removeEventListener("touchmove", suspendForManualIntent);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("scrollend", clearProgrammaticScroll);
    };
  }, [clearProgrammaticScroll, currentLineId, getCurrentGeometry]);

  // A new document/source replaces the line registry, so its old scroll target is obsolete.
  useEffect(() => () => clearProgrammaticScroll(), [clearProgrammaticScroll, registry]);

  return {
    enabled: state.enabled,
    setEnabled,
    mode: state.mode,
    setMode,
    suspended: state.suspension.type === "manual",
    resumeFollow: requestFollow,
    handleSeekIntent: requestFollow,
    registerStickyControls,
    registerLineElement: registry.register,
  };
}
