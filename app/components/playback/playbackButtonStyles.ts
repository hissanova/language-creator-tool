const focusClasses = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700";

export function toggleButtonClass(pressed: boolean) {
  return [
    "rounded-full border-2 px-3 py-1.5 font-medium transition-colors",
    focusClasses,
    pressed
      ? "border-emerald-700 bg-emerald-100 text-emerald-900 shadow-inner"
      : "border-gray-400 bg-white text-gray-500 hover:bg-gray-100",
  ].join(" ");
}

export function loopButtonClass({
  pressed,
  selected = false,
  disabled = false,
}: {
  pressed: boolean;
  selected?: boolean;
  disabled?: boolean;
}) {
  return [
    "inline-flex min-w-14 items-center justify-center rounded-full border-2 px-4 py-1.5 transition-colors",
    focusClasses,
    disabled ? "cursor-not-allowed border-gray-300 bg-gray-100 text-gray-400 opacity-60" : "",
    !disabled && pressed
      ? "border-emerald-700 bg-emerald-100 text-emerald-900 shadow-inner"
      : "",
    !disabled && selected && !pressed
      ? "border-gray-500 bg-gray-100 text-gray-500 outline outline-1 outline-offset-2 outline-gray-400"
      : "",
    !disabled && !selected && !pressed
      ? "border-gray-400 bg-white text-gray-500 hover:bg-gray-100"
      : "",
  ].filter(Boolean).join(" ");
}
