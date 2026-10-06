const focusClasses = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700";

export function playbackModeButtonClass({
  pressed,
  disabled = false,
}: {
  pressed: boolean;
  disabled?: boolean;
}) {
  return [
    "inline-flex min-h-11 min-w-14 items-center justify-center rounded-full border-2 px-4 py-1.5 transition-colors",
    focusClasses,
    disabled ? "viewer-disabled-surface cursor-not-allowed opacity-60" : "",
    !disabled && pressed
      ? "viewer-loop-surface shadow-inner"
      : "",
    !disabled && !pressed
      ? "viewer-interactive-surface"
      : "",
  ].filter(Boolean).join(" ");
}

// Shared transport colors; callers supply the already-resolved playing state.
export function playPauseSurfaceClass(playing: boolean) {
  return playing ? "viewer-playback-playing-surface" : "viewer-playback-idle-surface";
}

export function linePlaybackButtonClass({
  playing,
  pressed = false,
  disabled = false,
}: {
  playing?: boolean;
  pressed?: boolean;
  disabled?: boolean;
}) {
  return [
    "inline-flex h-10 w-10 min-h-10 min-w-10 aspect-square shrink-0 items-center justify-center rounded-full border-2 p-0 transition-colors",
    focusClasses,
    disabled ? "viewer-disabled-surface cursor-not-allowed opacity-60" : "",
    playing !== undefined ? "viewer-playback-button" : "",
    !disabled && playing !== undefined ? playPauseSurfaceClass(playing) : "",
    !disabled && playing === undefined && pressed
      ? "viewer-selected-surface shadow-inner"
      : "",
    !disabled && playing === undefined && !pressed
      ? "viewer-interactive-surface"
      : "",
  ].filter(Boolean).join(" ");
}
