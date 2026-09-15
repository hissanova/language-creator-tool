import { releasePlaybackButtonFocusOnPointerUp } from "../playback/playbackButtonFocus";
import type { AutoFollowMode } from "./autoFollow";

export function AutoFollowControls({
  enabled,
  mode,
  suspended,
  onEnabledChange,
  onModeChange,
  onResume,
}: {
  enabled: boolean;
  mode: AutoFollowMode;
  suspended: boolean;
  onEnabledChange: (enabled: boolean) => void;
  onModeChange: (mode: AutoFollowMode) => void;
  onResume: () => void;
}) {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-2 border-t pt-3 text-sm">
      <span className="font-medium text-gray-800">Auto-follow:</span>
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
                  ? "border-blue-700 bg-blue-100 text-blue-900"
                  : "border-gray-300 bg-white text-gray-800 hover:bg-gray-100",
              ].join(" ")}
            >
              {label}
            </button>
          );
        })}
      </div>
      <span className="ml-2 font-medium text-gray-800">Scroll mode:</span>
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
                  ? "border-blue-700 bg-blue-100 text-blue-900"
                  : "border-gray-300 bg-white text-gray-800 hover:bg-gray-100",
              ].join(" ")}
            >
              {label}
            </button>
          );
        })}
      </div>
      {enabled && suspended ? (
        <>
          <span className="text-amber-800">Auto-follow paused after manual scrolling.</span>
          <button
            type="button"
            aria-label="Resume auto-follow after manual scrolling"
            onClick={onResume}
            onPointerUp={releasePlaybackButtonFocusOnPointerUp}
            className="rounded border border-amber-700 bg-amber-50 px-2 py-1 font-medium text-amber-900 hover:bg-amber-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
          >
            Resume follow
          </button>
        </>
      ) : null}
    </div>
  );
}
