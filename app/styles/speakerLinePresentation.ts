import type { Speaker } from "../types/core/document";
import type {
  ScriptLinePresentation,
  SpeakerDisplayStyle,
} from "../types/viewerStyle";
import { NEUTRAL_SCRIPT_LINE_PRESENTATION } from "./scriptLinePresentation";

type SpeakerPaletteEntry = Pick<
  ScriptLinePresentation,
  "backgroundColor" | "accentColor" | "labelColor"
>;

export const SPEAKER_LINE_FALLBACK_PALETTE: readonly SpeakerPaletteEntry[] = [
  { backgroundColor: "#eff6ff", accentColor: "#2563eb", labelColor: "#1e40af" },
  { backgroundColor: "#ecfdf5", accentColor: "#059669", labelColor: "#065f46" },
  { backgroundColor: "#f5f3ff", accentColor: "#7c3aed", labelColor: "#5b21b6" },
  { backgroundColor: "#fff7ed", accentColor: "#ea580c", labelColor: "#9a3412" },
  { backgroundColor: "#ecfeff", accentColor: "#0891b2", labelColor: "#155e75" },
  { backgroundColor: "#fff1f2", accentColor: "#e11d48", labelColor: "#9f1239" },
  { backgroundColor: "#f7fee7", accentColor: "#65a30d", labelColor: "#3f6212" },
  { backgroundColor: "#fdf4ff", accentColor: "#c026d3", labelColor: "#86198f" },
];

function mergeSpeakerOverride(
  fallback: SpeakerPaletteEntry,
  override: SpeakerDisplayStyle | undefined,
): ScriptLinePresentation {
  return {
    backgroundColor: override?.backgroundColor ?? fallback.backgroundColor,
    accentColor: override?.accentColor ?? fallback.accentColor,
    labelColor: override?.nameColor ?? override?.style?.color ?? fallback.labelColor,
    labelClassName: override?.className,
    labelStyle: override?.style,
  };
}

export function resolveSpeakerLinePresentation({
  speakerId,
  speakers,
  overrides,
}: {
  speakerId?: string;
  speakers: readonly Speaker[];
  overrides?: Readonly<Record<string, SpeakerDisplayStyle>>;
}): ScriptLinePresentation {
  const speakerIndex = speakerId == null
    ? -1
    : speakers.findIndex((speaker) => speaker.id === speakerId);
  const fallback = speakerIndex < 0
    ? NEUTRAL_SCRIPT_LINE_PRESENTATION
    : SPEAKER_LINE_FALLBACK_PALETTE[
        speakerIndex % SPEAKER_LINE_FALLBACK_PALETTE.length
      ];

  return mergeSpeakerOverride(fallback, speakerId ? overrides?.[speakerId] : undefined);
}
