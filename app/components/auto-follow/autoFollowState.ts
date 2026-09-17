import {
  AUTO_FOLLOW_DEFAULT_ENABLED,
  AUTO_FOLLOW_DEFAULT_MODE,
  AUTO_FOLLOW_REWIND_TOLERANCE_SECONDS,
  type AutoFollowMode,
} from "./autoFollow";

export type AutoFollowObservation = {
  documentToken: unknown;
  sourceToken: unknown;
  playing: boolean;
  currentLineId: string | null;
  playbackPosition: number;
};

export type AutoFollowSuspension =
  | { type: "following" }
  | { type: "manual"; hasLeftSafeRegion: boolean };

export type AutoFollowState = {
  enabled: boolean;
  mode: AutoFollowMode;
  suspension: AutoFollowSuspension;
  playback: AutoFollowObservation | null;
  followRevision: number;
};

export type AutoFollowEvent =
  | { type: "playbackObserved"; observation: AutoFollowObservation }
  | { type: "enabledChanged"; enabled: boolean }
  | { type: "modeChanged"; mode: AutoFollowMode }
  | { type: "manualScrollIntent" }
  | { type: "manualScrollObserved"; lineWithinSafeRegion: boolean }
  | { type: "followRequested" };

const following: AutoFollowSuspension = { type: "following" };

export const initialAutoFollowState: AutoFollowState = {
  enabled: AUTO_FOLLOW_DEFAULT_ENABLED,
  mode: AUTO_FOLLOW_DEFAULT_MODE,
  suspension: following,
  playback: null,
  followRevision: 0,
};

function hasActiveLine(state: AutoFollowState) {
  return state.enabled && state.playback?.playing === true &&
    state.playback.currentLineId != null;
}

function requestFollow(state: AutoFollowState): AutoFollowState {
  return hasActiveLine(state)
    ? { ...state, followRevision: state.followRevision + 1 }
    : state;
}

export function reduceAutoFollow(
  state: AutoFollowState,
  event: AutoFollowEvent,
): AutoFollowState {
  switch (event.type) {
    case "playbackObserved": {
      const previous = state.playback;
      const next = event.observation;
      const playbackStarted = next.playing && previous?.playing === false;
      const suspension = playbackStarted ? following : state.suspension;
      const shouldEvaluate = previous == null ||
        previous.documentToken !== next.documentToken ||
        previous.sourceToken !== next.sourceToken ||
        playbackStarted ||
        previous.currentLineId !== next.currentLineId ||
        next.playbackPosition <
          previous.playbackPosition - AUTO_FOLLOW_REWIND_TOLERANCE_SECONDS;
      const updated = { ...state, playback: next, suspension };
      return shouldEvaluate && suspension.type === "following"
        ? requestFollow(updated)
        : updated;
    }
    case "enabledChanged": {
      if (!event.enabled) {
        return { ...state, enabled: false, suspension: following };
      }
      return state.enabled ? state : requestFollow({ ...state, enabled: true });
    }
    case "modeChanged": {
      if (state.mode === event.mode) return state;
      const updated = { ...state, mode: event.mode };
      return state.suspension.type === "following" ? requestFollow(updated) : updated;
    }
    case "manualScrollIntent":
      return hasActiveLine(state)
        ? { ...state, suspension: { type: "manual", hasLeftSafeRegion: false } }
        : state;
    case "manualScrollObserved": {
      if (!hasActiveLine(state)) return state;
      if (state.suspension.type === "following") {
        return {
          ...state,
          suspension: { type: "manual", hasLeftSafeRegion: !event.lineWithinSafeRegion },
        };
      }
      if (!event.lineWithinSafeRegion) {
        return state.suspension.hasLeftSafeRegion
          ? state
          : { ...state, suspension: { type: "manual", hasLeftSafeRegion: true } };
      }
      return state.suspension.hasLeftSafeRegion
        ? requestFollow({ ...state, suspension: following })
        : state;
    }
    case "followRequested":
      return requestFollow({ ...state, suspension: following });
  }
}
