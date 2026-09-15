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
    disabled ? "cursor-not-allowed border-gray-300 bg-gray-100 text-gray-400 opacity-60" : "",
    !disabled && pressed
      ? "border-emerald-700 bg-emerald-100 text-emerald-900 shadow-inner dark:border-emerald-300 dark:bg-emerald-900 dark:text-emerald-100"
      : "",
    !disabled && !pressed
      ? "border-gray-400 bg-white text-gray-500 hover:bg-gray-100"
      : "",
  ].filter(Boolean).join(" ");
}

export function linePlaybackButtonClass({
  pressed = false,
  disabled = false,
}: {
  pressed?: boolean;
  disabled?: boolean;
}) {
  return [
    "inline-flex h-10 w-10 min-h-10 min-w-10 aspect-square shrink-0 items-center justify-center rounded-full border-2 p-0 transition-colors",
    focusClasses,
    disabled ? "cursor-not-allowed border-gray-300 bg-gray-100 text-gray-400 opacity-60" : "",
    !disabled && pressed
      ? "border-blue-700 bg-blue-100 text-blue-900 shadow-inner dark:border-blue-300 dark:bg-blue-900 dark:text-blue-100"
      : "",
    !disabled && !pressed
      ? "border-gray-400 bg-white text-gray-500 hover:bg-gray-100"
      : "",
  ].filter(Boolean).join(" ");
}
