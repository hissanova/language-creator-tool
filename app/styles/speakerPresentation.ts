import type { Speaker } from "../types/core/document";
import type {
  SpeakerDisplayStyle,
  SpeakerPresentation,
} from "../types/viewerStyle";

type SpeakerPaletteEntry = Pick<
  SpeakerPresentation,
  "backgroundColor" | "accentColor" | "nameColor"
>;

export const SPEAKER_FALLBACK_PALETTE: readonly SpeakerPaletteEntry[] = [
  { backgroundColor: "#eff6ff", accentColor: "#2563eb", nameColor: "#1e40af" },
  { backgroundColor: "#ecfdf5", accentColor: "#059669", nameColor: "#065f46" },
  { backgroundColor: "#f5f3ff", accentColor: "#7c3aed", nameColor: "#5b21b6" },
  { backgroundColor: "#fff7ed", accentColor: "#ea580c", nameColor: "#9a3412" },
  { backgroundColor: "#ecfeff", accentColor: "#0891b2", nameColor: "#155e75" },
  { backgroundColor: "#fff1f2", accentColor: "#e11d48", nameColor: "#9f1239" },
  { backgroundColor: "#f7fee7", accentColor: "#65a30d", nameColor: "#3f6212" },
  { backgroundColor: "#fdf4ff", accentColor: "#c026d3", nameColor: "#86198f" },
];

export const NEUTRAL_SPEAKER_PRESENTATION: SpeakerPaletteEntry = {
  backgroundColor: "#f9fafb",
  accentColor: "#9ca3af",
  nameColor: "#374151",
};

function mergeSpeakerOverride(
  fallback: SpeakerPaletteEntry,
  override: SpeakerDisplayStyle | undefined,
): SpeakerPresentation {
  return {
    backgroundColor: override?.backgroundColor ?? fallback.backgroundColor,
    accentColor: override?.accentColor ?? fallback.accentColor,
    nameColor: override?.nameColor ?? override?.style?.color ?? fallback.nameColor,
    nameClassName: override?.className,
    nameStyle: override?.style,
  };
}

export function resolveSpeakerPresentation({
  speakerId,
  speakers,
  overrides,
}: {
  speakerId?: string;
  speakers: readonly Speaker[];
  overrides?: Readonly<Record<string, SpeakerDisplayStyle>>;
}): SpeakerPresentation {
  const speakerIndex = speakerId == null
    ? -1
    : speakers.findIndex((speaker) => speaker.id === speakerId);
  const fallback = speakerIndex < 0
    ? NEUTRAL_SPEAKER_PRESENTATION
    : SPEAKER_FALLBACK_PALETTE[speakerIndex % SPEAKER_FALLBACK_PALETTE.length];

  return mergeSpeakerOverride(fallback, speakerId ? overrides?.[speakerId] : undefined);
}
