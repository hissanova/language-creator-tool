export const AUTO_FOLLOW_DEFAULT_ENABLED = true;
export const AUTO_FOLLOW_DEFAULT_MODE = "unpinned" as const;
export const AUTO_FOLLOW_SAFE_REGION_RATIO = 0.5;
export const AUTO_FOLLOW_PROGRAMMATIC_SCROLL_TIMEOUT_MS = 1_200;
export const AUTO_FOLLOW_REWIND_TOLERANCE_SECONDS = 0.05;

export type AutoFollowMode = "unpinned" | "pinned";

export type VerticalRegion = {
  top: number;
  bottom: number;
};

export type AutoFollowSnapshot = {
  documentToken: unknown;
  sourceToken: unknown;
  enabled: boolean;
  playing: boolean;
  currentLineId: string | null;
  playbackPosition: number;
  mode: AutoFollowMode;
  followRequest: number;
};

export type ProgrammaticScroll = {
  targetY: number;
  expiresAt: number;
};

export type ManualScrollSuspension = {
  suspended: boolean;
  outsideSafeRegion: boolean;
  shouldResume: boolean;
};

type KeyboardScrollIntent = {
  altKey: boolean;
  ctrlKey: boolean;
  defaultPrevented: boolean;
  key: string;
  metaKey: boolean;
  target: EventTarget | null;
};

type InteractiveTarget = EventTarget & {
  closest?: (selectors: string) => Element | null;
  parentElement?: Element | null;
};

const INTERACTIVE_SCROLL_TARGET_SELECTOR = [
  "input",
  "textarea",
  "select",
  "button",
  "a[href]",
  "[contenteditable]:not([contenteditable=\"false\"])",
  "[role=\"textbox\"]",
  "[role=\"slider\"]",
  "[role=\"button\"]",
  "[role=\"link\"]",
  "[role=\"listbox\"]",
  "[role=\"menu\"]",
  "[role=\"tab\"]",
  "[role=\"tree\"]",
  ".monaco-editor",
].join(", ");

const MANUAL_SCROLL_KEYS = new Set([
  "PageUp",
  "PageDown",
  "Home",
  "End",
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
]);

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), maximum);
}

export function getUsableViewport(
  viewportHeight: number,
  stickyControlsRect: VerticalRegion | null,
): VerticalRegion {
  const bottom = Math.max(0, viewportHeight);
  const controlsIntersectViewport = stickyControlsRect != null &&
    stickyControlsRect.bottom > 0 &&
    stickyControlsRect.top < bottom;
  const top = controlsIntersectViewport
    ? clamp(stickyControlsRect.bottom, 0, bottom)
    : 0;

  return { top, bottom };
}

export function getAutoFollowSafeRegion(
  usableViewport: VerticalRegion,
): VerticalRegion {
  const height = Math.max(0, usableViewport.bottom - usableViewport.top);
  const inset = height * (1 - AUTO_FOLLOW_SAFE_REGION_RATIO) / 2;
  return {
    top: usableViewport.top + inset,
    bottom: usableViewport.bottom - inset,
  };
}

export function isLineWithinRegion(
  lineRect: VerticalRegion,
  region: VerticalRegion,
) {
  return lineRect.top >= region.top && lineRect.bottom <= region.bottom;
}

export function getCenteredScrollTarget(
  lineRect: VerticalRegion,
  usableViewport: VerticalRegion,
  currentScrollY: number,
) {
  const lineCenter = (lineRect.top + lineRect.bottom) / 2;
  const viewportCenter = (usableViewport.top + usableViewport.bottom) / 2;
  return Math.max(0, currentScrollY + lineCenter - viewportCenter);
}

export function resolveAutoFollowScrollTarget({
  mode,
  lineRect,
  usableViewport,
  currentScrollY,
}: {
  mode: AutoFollowMode;
  lineRect: VerticalRegion | null;
  usableViewport: VerticalRegion;
  currentScrollY: number;
}): number | null {
  if (lineRect == null) return null;
  if (
    mode === "unpinned" &&
    isLineWithinRegion(lineRect, getAutoFollowSafeRegion(usableViewport))
  ) {
    return null;
  }

  return getCenteredScrollTarget(lineRect, usableViewport, currentScrollY);
}

export function getAutoFollowScrollBehavior(reducedMotion: boolean): ScrollBehavior {
  return reducedMotion ? "auto" : "smooth";
}

export function shouldIgnoreProgrammaticScroll(
  programmaticScroll: ProgrammaticScroll | null,
  now: number,
) {
  return programmaticScroll != null && now <= programmaticScroll.expiresAt;
}

export function resolveManualScrollSuspension({
  suspended,
  outsideSafeRegion,
  lineWithinSafeRegion,
}: {
  suspended: boolean;
  outsideSafeRegion: boolean;
  lineWithinSafeRegion: boolean;
}): ManualScrollSuspension {
  if (!suspended) {
    return {
      suspended: true,
      outsideSafeRegion: !lineWithinSafeRegion,
      shouldResume: false,
    };
  }
  if (!lineWithinSafeRegion) {
    return { suspended: true, outsideSafeRegion: true, shouldResume: false };
  }
  if (outsideSafeRegion) {
    return { suspended: false, outsideSafeRegion: false, shouldResume: true };
  }
  return { suspended: true, outsideSafeRegion: false, shouldResume: false };
}

export function shouldEvaluateAutoFollow(
  previous: AutoFollowSnapshot | null,
  next: AutoFollowSnapshot,
) {
  if (!next.enabled || !next.playing || next.currentLineId == null) return false;
  if (previous == null) return true;

  return previous.documentToken !== next.documentToken ||
    previous.sourceToken !== next.sourceToken ||
    !previous.enabled ||
    !previous.playing ||
    previous.currentLineId !== next.currentLineId ||
    next.playbackPosition <
      previous.playbackPosition - AUTO_FOLLOW_REWIND_TOLERANCE_SECONDS ||
    previous.mode !== next.mode ||
    previous.followRequest !== next.followRequest;
}

export function shouldRunAutoFollow({
  shouldEvaluate,
  suspended,
  playbackStarted,
}: {
  shouldEvaluate: boolean;
  suspended: boolean;
  playbackStarted: boolean;
}) {
  return shouldEvaluate && (!suspended || playbackStarted);
}

export function isInteractiveAutoFollowTarget(target: EventTarget | null) {
  const candidate = target as InteractiveTarget | null;
  const element = typeof candidate?.closest === "function"
    ? candidate
    : candidate?.parentElement;
  return element?.closest?.(INTERACTIVE_SCROLL_TARGET_SELECTOR) != null;
}

export function isManualAutoFollowKey(event: KeyboardScrollIntent) {
  return !event.defaultPrevented &&
    !event.altKey &&
    !event.ctrlKey &&
    !event.metaKey &&
    MANUAL_SCROLL_KEYS.has(event.key) &&
    !isInteractiveAutoFollowTarget(event.target);
}
