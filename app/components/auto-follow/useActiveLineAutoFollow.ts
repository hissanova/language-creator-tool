"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef } from "react";
import {
  AUTO_FOLLOW_PROGRAMMATIC_SCROLL_QUIET_MS,
  createProgrammaticScroll,
  getAutoFollowScrollBehavior,
  getAutoFollowSafeRegion,
  getUsableViewport,
  isLineWithinRegion,
  isManualAutoFollowKey,
  reduceProgrammaticScroll,
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
  const nextProgrammaticScrollTokenRef = useRef(1);

  const registry = useMemo(() => {
    void documentToken;
    void sourceToken;
    return createLineElementRegistry();
  }, [documentToken, sourceToken]);

  const registerStickyControls = useCallback((element: HTMLDivElement | null) => {
    stickyControlsElementRef.current = element;
  }, []);

  const clearProgrammaticScroll = useCallback((
    token?: number,
    reason: "manualIntent" | "sourceChanged" = "manualIntent",
  ) => {
    programmaticScrollRef.current = token == null
      ? reduceProgrammaticScroll(programmaticScrollRef.current, { type: reason })
      : reduceProgrammaticScroll(programmaticScrollRef.current, { type: "quietElapsed", token });
    if (programmaticScrollRef.current != null) return;
    if (programmaticScrollTimerRef.current != null) {
      window.clearTimeout(programmaticScrollTimerRef.current);
      programmaticScrollTimerRef.current = null;
    }
  }, []);

  const scheduleProgrammaticScrollSettlement = useCallback((token: number) => {
    if (programmaticScrollTimerRef.current != null) {
      window.clearTimeout(programmaticScrollTimerRef.current);
    }
    programmaticScrollTimerRef.current = window.setTimeout(
      () => clearProgrammaticScroll(token),
      AUTO_FOLLOW_PROGRAMMATIC_SCROLL_QUIET_MS,
    );
  }, [clearProgrammaticScroll]);

  const beginProgrammaticScroll = useCallback((targetY: number | null = null) => {
    clearProgrammaticScroll();
    const operation = createProgrammaticScroll(
      nextProgrammaticScrollTokenRef.current++,
      targetY,
    );
    programmaticScrollRef.current = operation;
    scheduleProgrammaticScrollSettlement(operation.token);
    return operation;
  }, [clearProgrammaticScroll, scheduleProgrammaticScrollSettlement]);

  const settleProgrammaticScroll = useCallback((
    eventType: "scrollObserved" | "scrollEnded" = "scrollObserved",
  ) => {
    const operation = programmaticScrollRef.current;
    if (!operation) return false;
    const settling = reduceProgrammaticScroll(operation, { type: eventType });
    if (!settling) return false;
    programmaticScrollRef.current = settling;
    scheduleProgrammaticScrollSettlement(settling.token);
    return true;
  }, [scheduleProgrammaticScrollSettlement]);

  const setEnabled = useCallback((enabled: boolean) => {
    if (!enabled) clearProgrammaticScroll();
    dispatch({ type: "enabledChanged", enabled });
  }, [clearProgrammaticScroll]);

  const setMode = useCallback((mode: AutoFollowMode) => {
    dispatch({ type: "modeChanged", mode });
  }, []);

  const requestFollow = useCallback(() => {
    // Arm before dispatch: hiding Resume can change sticky-control height and scroll
    // the page before the follow effect gets a chance to evaluate the active line.
    beginProgrammaticScroll();
    dispatch({ type: "followRequested" });
  }, [beginProgrammaticScroll]);

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
    const operation = beginProgrammaticScroll();
    programmaticScrollRef.current = reduceProgrammaticScroll(operation, {
      type: "targetResolved",
      targetY,
    });
    if (targetY == null) return;

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
      if (!state.enabled || !playing || currentLineId == null) return;
      clearProgrammaticScroll();
      dispatch({ type: "manualScrollIntent" });
    };

    const onKeyDown = (event: KeyboardEvent) => {
      queueMicrotask(() => {
        if (isManualAutoFollowKey(event)) suspendForManualIntent();
      });
    };

    const onScroll = () => {
      if (shouldIgnoreProgrammaticScroll(programmaticScrollRef.current)) {
        settleProgrammaticScroll();
        return;
      }
      if (!state.enabled || !playing || currentLineId == null) return;

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

    const onScrollEnd = () => {
      // scrollend is settlement evidence, not proof that no trailing scroll event
      // from the same browser operation remains queued.
      settleProgrammaticScroll("scrollEnded");
    };

    window.addEventListener("wheel", suspendForManualIntent, { passive: true });
    window.addEventListener("touchmove", suspendForManualIntent, { passive: true });
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("scrollend", onScrollEnd);
    return () => {
      window.removeEventListener("wheel", suspendForManualIntent);
      window.removeEventListener("touchmove", suspendForManualIntent);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("scrollend", onScrollEnd);
    };
  }, [clearProgrammaticScroll, currentLineId, getCurrentGeometry, playing, settleProgrammaticScroll, state.enabled]);

  // A new document/source replaces the line registry, so its old scroll target is obsolete.
  useEffect(
    () => () => clearProgrammaticScroll(undefined, "sourceChanged"),
    [clearProgrammaticScroll, registry],
  );

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
