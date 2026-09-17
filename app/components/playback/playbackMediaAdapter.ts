import type { PlaybackAction } from "./playbackState";
import type { PendingPlayback, PlaybackInstruction } from "./playbackMediaPlan";

export type MutablePlaybackRef<T> = { current: T };

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
