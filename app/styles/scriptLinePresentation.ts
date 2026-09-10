import type {
  ScriptLineFrameStyle,
  ScriptLinePresentation,
} from "../types/viewerStyle";

export type LineRailPosition = "none" | "left" | "both" | "right";
export type LineBackgroundEmphasis = "off" | "on";
export type LineElevation = "off" | "on";

export type LineHighlightExperiment = {
  railPosition: LineRailPosition;
  backgroundEmphasis: LineBackgroundEmphasis;
  elevation: LineElevation;
};

export const DEFAULT_LINE_HIGHLIGHT_EXPERIMENT: LineHighlightExperiment = {
  railPosition: "left",
  backgroundEmphasis: "off",
  elevation: "off",
};

export const SCRIPT_LINE_RAIL_WIDTH = "10px";

export const NEUTRAL_SCRIPT_LINE_PRESENTATION: ScriptLinePresentation = {
  backgroundColor: "#f9fafb",
  accentColor: "#9ca3af",
  labelColor: "#374151",
};

export function parseLineHighlightExperiment(values: {
  activeLineRail?: string | null;
  activeLineBackground?: string | null;
  activeLineElevation?: string | null;
}): LineHighlightExperiment {
  const railPosition = values.activeLineRail;
  return {
    railPosition:
      railPosition === "none" ||
      railPosition === "left" ||
      railPosition === "both" ||
      railPosition === "right"
        ? railPosition
        : DEFAULT_LINE_HIGHLIGHT_EXPERIMENT.railPosition,
    backgroundEmphasis:
      values.activeLineBackground === "on" || values.activeLineBackground === "off"
        ? values.activeLineBackground
        : DEFAULT_LINE_HIGHLIGHT_EXPERIMENT.backgroundEmphasis,
    elevation:
      values.activeLineElevation === "on" || values.activeLineElevation === "off"
        ? values.activeLineElevation
        : DEFAULT_LINE_HIGHLIGHT_EXPERIMENT.elevation,
  };
}

function strengthenedBackground(presentation: ScriptLinePresentation) {
  return `color-mix(in srgb, ${presentation.backgroundColor} 84%, ${presentation.accentColor} 16%)`;
}

export function resolveScriptLinePresentation(
  presentation: ScriptLinePresentation,
  isCurrentPlaybackLine: boolean,
  experiment: LineHighlightExperiment = DEFAULT_LINE_HIGHLIGHT_EXPERIMENT,
): ScriptLinePresentation {
  const hasLeftRail =
    experiment.railPosition === "left" || experiment.railPosition === "both";
  const hasRightRail =
    experiment.railPosition === "right" || experiment.railPosition === "both";
  const railClassName = experiment.railPosition === "none"
    ? undefined
    : `script-line-rail-${experiment.railPosition}`;
  const railStyle: ScriptLineFrameStyle | undefined = railClassName
    ? {
        "--script-line-radius": "0.75rem",
        "--script-line-rail-fill": isCurrentPlaybackLine
          ? presentation.labelColor
          : presentation.backgroundColor,
        "--script-line-rail-outline":
          "color-mix(in srgb, var(--foreground) 48%, var(--background))",
        "--script-line-rail-width": SCRIPT_LINE_RAIL_WIDTH,
        paddingLeft: hasLeftRail
          ? `calc(0.5rem + ${SCRIPT_LINE_RAIL_WIDTH})`
          : undefined,
        paddingRight: hasRightRail
          ? `calc(0.5rem + ${SCRIPT_LINE_RAIL_WIDTH})`
          : undefined,
        position: "relative",
      }
    : undefined;
  const isBackgroundEmphasized =
    isCurrentPlaybackLine && experiment.backgroundEmphasis === "on";
  const isElevated = isCurrentPlaybackLine && experiment.elevation === "on";

  if (!railStyle && !isBackgroundEmphasized && !isElevated) {
    return presentation;
  }

  return {
    ...presentation,
    backgroundColor: isBackgroundEmphasized
      ? strengthenedBackground(presentation)
      : presentation.backgroundColor,
    frameClassName: [presentation.frameClassName, railClassName]
      .filter(Boolean)
      .join(" ") || undefined,
    frameStyle: {
      ...presentation.frameStyle,
      ...railStyle,
      ...(isElevated
        ? {
            boxShadow: "var(--script-line-elevation-shadow)",
            position: "relative",
            transform: "translateY(-1px)",
            zIndex: 1,
          }
        : undefined),
    },
  };
}
