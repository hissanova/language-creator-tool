import type { PlaybackAction } from "./playbackState";
import type { PendingPlayback, PlaybackInstruction } from "./playbackMediaPlan";

export type MutablePlaybackRef<T> = { current: T };

export const PLAYBACK_RATE_STORAGE_KEY = "lct.viewer.playbackRate";

/** Executes the planner's ordered protocol; all media mutations live here. */
export function executePlaybackInstructions(
  instructions: readonly PlaybackInstruction[],
  context: {
    element: HTMLMediaElement | null;
    pendingPlaybackRef: MutablePlaybackRef<PendingPlayback | null>;
    dispatchAndSync: (action: PlaybackAction) => void;
  },
): void {
  const { element, pendingPlaybackRef, dispatchAndSync } = context;
  for (const instruction of instructions) {
    switch (instruction.type) {
      case "dispatch": dispatchAndSync(instruction.action); break;
      case "setPending": pendingPlaybackRef.current = instruction.pending; break;
      case "seekMedia": if (element) element.currentTime = instruction.time; break;
      case "setMediaPlaybackRate": if (element) element.playbackRate = instruction.playbackRate; break;
      case "persistPlaybackRate":
        localStorage.setItem(PLAYBACK_RATE_STORAGE_KEY, String(instruction.playbackRate));
        break;
      case "pauseMedia": element?.pause(); break;
      case "playMedia":
        if (element) void element.play().catch(() => {
          dispatchAndSync({ type: "setPlaying", playing: false });
        });
        break;
      case "warn": console.warn(instruction.message); break;
    }
  }
}
