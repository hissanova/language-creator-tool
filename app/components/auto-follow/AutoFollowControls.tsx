import { releasePlaybackButtonFocusOnPointerUp } from "../playback/playbackButtonFocus";
import type { AutoFollowMode } from "./autoFollow";

export function AutoFollowControls({
  enabled,
  mode,
  onEnabledChange,
  onModeChange,
}: {
  enabled: boolean;
  mode: AutoFollowMode;
  onEnabledChange: (enabled: boolean) => void;
  onModeChange: (mode: AutoFollowMode) => void;
}) {
  return (
    <>
      <div className="grid gap-1" data-viewer-setting="auto-follow">
        <span className="text-sm font-medium">Auto-follow</span>
        <div className="inline-flex gap-1" role="group" aria-label="Auto-follow">
        {([true, false] as const).map((option) => {
          const selected = enabled === option;
          const label = option ? "On" : "Off";
          return (
            <button
              key={label}
              type="button"
              aria-pressed={selected}
              onClick={() => onEnabledChange(option)}
              onPointerUp={releasePlaybackButtonFocusOnPointerUp}
              className={[
                "rounded border px-2 py-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700",
                selected
                  ? "viewer-selected-surface"
                  : "viewer-interactive-surface",
              ].join(" ")}
            >
              {label}
            </button>
          );
        })}
        </div>
      </div>
      <div className="grid gap-1" data-viewer-setting="follow-mode">
        <span className="text-sm font-medium">Follow position</span>
        <div className="inline-flex gap-1" role="group" aria-label="Auto-follow scroll mode">
        {(["unpinned", "pinned"] as const).map((option) => {
          const selected = mode === option;
          const label = option === "unpinned" ? "Unpinned" : "Pinned";
          return (
            <button
              key={option}
              type="button"
              aria-pressed={selected}
              disabled={!enabled}
              onClick={() => onModeChange(option)}
              onPointerUp={releasePlaybackButtonFocusOnPointerUp}
              className={[
                "rounded border px-2 py-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 disabled:cursor-not-allowed disabled:opacity-50",
                selected
                  ? "viewer-selected-surface"
                  : "viewer-interactive-surface",
              ].join(" ")}
            >
              {label}
            </button>
          );
        })}
        </div>
      </div>
    </>
  );
}
