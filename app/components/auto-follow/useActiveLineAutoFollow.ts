"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AUTO_FOLLOW_DEFAULT_MODE,
  AUTO_FOLLOW_DEFAULT_ENABLED,
  AUTO_FOLLOW_PROGRAMMATIC_SCROLL_TIMEOUT_MS,
  getAutoFollowScrollBehavior,
  getAutoFollowSafeRegion,
  getUsableViewport,
  isLineWithinRegion,
  isManualAutoFollowKey,
  resolveAutoFollowScrollTarget,
  resolveManualScrollSuspension,
  shouldIgnoreProgrammaticScroll,
  shouldEvaluateAutoFollow,
  shouldRunAutoFollow,
  type AutoFollowMode,
  type AutoFollowSnapshot,
  type ProgrammaticScroll,
} from "./autoFollow";

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
}: {
  documentToken: unknown;
  sourceToken: unknown;
  currentLineId: string | null;
  playbackPosition: number;
  playing: boolean;
}) {
  const [enabled, setEnabledState] = useState(AUTO_FOLLOW_DEFAULT_ENABLED);
  const [mode, setMode] = useState<AutoFollowMode>(AUTO_FOLLOW_DEFAULT_MODE);
  const [suspended, setSuspendedState] = useState(false);
  const [followRequest, setFollowRequest] = useState(0);
  const stickyControlsElementRef = useRef<HTMLDivElement | null>(null);
  const previousSnapshotRef = useRef<AutoFollowSnapshot | null>(null);
  const suspendedRef = useRef(false);
  const suspendedOutsideSafeRegionRef = useRef(false);
  const programmaticScrollRef = useRef<ProgrammaticScroll | null>(null);
  const programmaticScrollTimerRef = useRef<number | null>(null);
  const latestRef = useRef({ currentLineId, enabled, mode, playing });

  const registry = useMemo(() => {
    void documentToken;
    void sourceToken;
    return createLineElementRegistry();
  }, [documentToken, sourceToken]);

  useEffect(() => {
    latestRef.current = { currentLineId, enabled, mode, playing };
  }, [currentLineId, enabled, mode, playing]);

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

  const setSuspended = useCallback((next: boolean) => {
    suspendedRef.current = next;
    setSuspendedState(next);
  }, []);

  const setEnabled = useCallback((next: boolean) => {
    setEnabledState(next);
    if (next) return;
    clearProgrammaticScroll();
    suspendedOutsideSafeRegionRef.current = false;
    setSuspended(false);
  }, [clearProgrammaticScroll, setSuspended]);

  const requestFollow = useCallback(() => {
    suspendedOutsideSafeRegionRef.current = false;
    setSuspended(false);
    setFollowRequest((request) => request + 1);
  }, [setSuspended]);

  const getCurrentGeometry = useCallback(() => {
    const lineId = latestRef.current.currentLineId;
    const lineElement = lineId ? registry.elements.get(lineId) : undefined;
    if (!lineElement?.isConnected) return null;

    const lineRect = lineElement.getBoundingClientRect();
    const stickyRect = stickyControlsElementRef.current?.getBoundingClientRect() ?? null;
    const usableViewport = getUsableViewport(window.innerHeight, stickyRect);
    return { lineRect, usableViewport };
  }, [registry]);

  const followCurrentLine = useCallback(() => {
    const geometry = getCurrentGeometry();
    if (!geometry) return;

    const targetY = resolveAutoFollowScrollTarget({
      mode: latestRef.current.mode,
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
  }, [clearProgrammaticScroll, getCurrentGeometry]);

  useEffect(() => {
    const nextSnapshot: AutoFollowSnapshot = {
      documentToken,
      sourceToken,
      enabled,
      playing,
      currentLineId,
      playbackPosition,
      mode,
      followRequest,
    };
    const previousSnapshot = previousSnapshotRef.current;
    const playbackStarted = playing && previousSnapshot?.playing === false;
    const shouldEvaluate = shouldEvaluateAutoFollow(previousSnapshot, nextSnapshot);
    previousSnapshotRef.current = nextSnapshot;

    if (playbackStarted) {
      suspendedOutsideSafeRegionRef.current = false;
      setSuspended(false);
    }
    if (!shouldRunAutoFollow({
      shouldEvaluate,
      suspended: suspendedRef.current,
      playbackStarted,
    })) return;
    followCurrentLine();
  }, [
    currentLineId,
    documentToken,
    enabled,
    followCurrentLine,
    followRequest,
    mode,
    playbackPosition,
    playing,
    setSuspended,
    sourceToken,
  ]);

  useEffect(() => {
    const suspendForManualIntent = () => {
      if (
        !latestRef.current.enabled ||
        !latestRef.current.playing ||
        latestRef.current.currentLineId == null
      ) return;
      clearProgrammaticScroll();
      suspendedOutsideSafeRegionRef.current = false;
      setSuspended(true);
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
      if (
        !latestRef.current.enabled ||
        !latestRef.current.playing ||
        latestRef.current.currentLineId == null
      ) return;

      const geometry = getCurrentGeometry();
      if (!geometry) return;
      const isWithinSafeRegion = isLineWithinRegion(
        geometry.lineRect,
        getAutoFollowSafeRegion(geometry.usableViewport),
      );

      const nextSuspension = resolveManualScrollSuspension({
        suspended: suspendedRef.current,
        outsideSafeRegion: suspendedOutsideSafeRegionRef.current,
        lineWithinSafeRegion: isWithinSafeRegion,
      });
      suspendedOutsideSafeRegionRef.current = nextSuspension.outsideSafeRegion;
      if (nextSuspension.shouldResume) requestFollow();
      else setSuspended(nextSuspension.suspended);
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
      clearProgrammaticScroll();
    };
  }, [clearProgrammaticScroll, getCurrentGeometry, requestFollow, setSuspended]);

  return {
    enabled,
    setEnabled,
    mode,
    setMode,
    suspended,
    resumeFollow: requestFollow,
    handleSeekIntent: requestFollow,
    registerStickyControls,
    registerLineElement: registry.register,
  };
}
