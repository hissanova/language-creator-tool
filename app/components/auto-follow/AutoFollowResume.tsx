import { releasePlaybackButtonFocusOnPointerUp } from "../playback/playbackButtonFocus";
import type { ResumePlacement } from "./autoFollow";

export function AutoFollowResume({
  placement,
  bottomObstruction,
  onResume,
}: {
  placement: ResumePlacement;
  bottomObstruction: number;
  onResume: () => void;
}) {
  const direction = placement === "top" ? "up" : placement === "bottom" ? "down" : null;
  return (
    <div
      className={[
        "pointer-events-none fixed left-1/2 z-40 -translate-x-1/2",
      ].join(" ")}
      style={placement === "top"
        ? { top: "max(4.5rem, calc(env(safe-area-inset-top) + 4.5rem))" }
        : { bottom: bottomObstruction + 16 }}
      data-resume-placement={placement}
    >
      <button
        type="button"
        aria-label={`Resume auto-follow after manual scrolling${direction ? `; target is ${direction}` : ""}`}
        onClick={onResume}
        onPointerUp={releasePlaybackButtonFocusOnPointerUp}
        className="viewer-resume-surface pointer-events-auto rounded-full border px-4 py-2 font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
      >
        {direction === "up" ? "↑ " : direction === "down" ? "↓ " : ""}Resume follow
      </button>
    </div>
  );
}
