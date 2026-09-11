import type {
  ScriptLineFrameStyle,
  ScriptLinePresentation,
} from "../types/viewerStyle";

export const SCRIPT_LINE_RAIL_WIDTH = "10px";

export const NEUTRAL_SCRIPT_LINE_PRESENTATION: ScriptLinePresentation = {
  backgroundColor: "#f9fafb",
  accentColor: "#9ca3af",
  labelColor: "#374151",
};

function strengthenedBackground(presentation: ScriptLinePresentation) {
  return `color-mix(in srgb, ${presentation.backgroundColor} 84%, ${presentation.accentColor} 16%)`;
}

export function resolveScriptLinePresentation(
  presentation: ScriptLinePresentation,
  isCurrentPlaybackLine: boolean,
): ScriptLinePresentation {
  const railStyle: ScriptLineFrameStyle = {
    "--script-line-radius": "0.75rem",
    "--script-line-rail-fill": isCurrentPlaybackLine
      ? presentation.labelColor
      : presentation.backgroundColor,
    "--script-line-rail-outline":
      "color-mix(in srgb, var(--foreground) 48%, var(--background))",
    "--script-line-rail-width": SCRIPT_LINE_RAIL_WIDTH,
    paddingLeft: `calc(0.5rem + ${SCRIPT_LINE_RAIL_WIDTH})`,
    position: "relative",
  };

  return {
    ...presentation,
    backgroundColor: isCurrentPlaybackLine
      ? strengthenedBackground(presentation)
      : presentation.backgroundColor,
    frameClassName: [presentation.frameClassName, "script-line-rail-left"]
      .filter(Boolean)
      .join(" "),
    frameStyle: {
      ...presentation.frameStyle,
      ...railStyle,
      ...(isCurrentPlaybackLine
        ? {
            boxShadow: "var(--script-line-elevation-shadow)",
            transform: "translateY(-1px)",
            zIndex: 1,
          }
        : undefined),
    },
  };
}
