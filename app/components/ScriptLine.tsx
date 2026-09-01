import type { CSSProperties, ReactNode } from "react";
import type { Speaker } from "../types/core/document";
import type { ViewerStyle } from "../types/viewerStyle";
import type { LinePlaybackRange } from "./playback/playbackState";
import { LoopIcon, PauseIcon, PlayIcon } from "./playback/PlaybackIcons";
import { loopButtonClass } from "./playback/playbackButtonStyles";
import { activateLinePlaybackControl } from "./playback/linePlaybackControl";
import { ScriptLineFrame } from "./script-line/ScriptLineFrame";
import { ScriptLineRow } from "./script-line/ScriptLineRow";

type Props = {
  speaker?: Speaker;
  speakerId?: string;
  playbackRange?: LinePlaybackRange | null;
  hasPlaybackTiming?: boolean;
  isLoopSelected?: boolean;
  isLinePlaying?: boolean;
  loopEnabled?: boolean;
  onPause?: () => void;
  onPlayLine?: (range: LinePlaybackRange) => void;
  onToggleLineLoop?: (range: LinePlaybackRange) => void;
  style: ViewerStyle;
  layoutVariant: "inline" | "grid";
  textContent: ReactNode;
  textClassName?: string;
  textStyle?: CSSProperties;
  languageLabel?: string;
  translations?: ReactNode;
  rowClassName?: string;
  topSlot?: ReactNode;
  bottomSlot?: ReactNode;
};

export function ScriptLine({
  speaker,
  speakerId,
  playbackRange,
  hasPlaybackTiming = false,
  isLoopSelected = false,
  isLinePlaying = false,
  loopEnabled = false,
  onPause,
  onPlayLine,
  onToggleLineLoop,
  style,
  layoutVariant,
  textContent,
  textClassName,
  textStyle,
  languageLabel,
  translations,
  rowClassName,
  topSlot,
  bottomSlot,
}: Props) {
  const speakerStyle = style.speaker.default;
  const speakerDisplayStyle = speakerId ? style.speakers?.[speakerId] : undefined;
  const speakerNameStyle: CSSProperties | undefined = speakerDisplayStyle
    ? {
        ...speakerDisplayStyle.style,
        color: speakerDisplayStyle.nameColor ?? speakerDisplayStyle.style?.color,
      }
    : undefined;
  const isGridLayout = layoutVariant === "grid";
  const linePlaybackLabel = isLinePlaying ? "Pause this line" : "Play this line";
  const lineLoopLabel = isLoopSelected ? "Clear loop range" : "Loop this line";

  const playControl = hasPlaybackTiming ? (
    <div className={isGridLayout ? "flex gap-1" : "mr-2 inline-flex gap-1 align-middle"}>
      <button
        type="button"
        disabled={!playbackRange}
        onClick={() => activateLinePlaybackControl({
          isLinePlaying,
          range: playbackRange,
          pause: onPause,
          playLine: onPlayLine,
        })}
        className={`${style.layout.playButton} focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 disabled:cursor-not-allowed disabled:opacity-40`}
        aria-label={linePlaybackLabel}
        title={playbackRange ? linePlaybackLabel : "Line timing is invalid or its audio cannot be resolved"}
      >
        {isLinePlaying ? <PauseIcon className="h-4 w-4" /> : <PlayIcon className="h-4 w-4" />}
      </button>
      <button
        type="button"
        disabled={!playbackRange}
        aria-pressed={isLoopSelected && loopEnabled}
        data-loop-selected={isLoopSelected ? (loopEnabled ? "active" : "inactive") : undefined}
        onClick={() => playbackRange && onToggleLineLoop?.(playbackRange)}
        className={loopButtonClass({
          pressed: isLoopSelected && loopEnabled,
          selected: isLoopSelected,
          disabled: !playbackRange,
        })}
        aria-label={lineLoopLabel}
        title={playbackRange ? lineLoopLabel : "Line timing is invalid or its audio cannot be resolved"}
      >
        <LoopIcon className="h-4 w-4" />
      </button>
    </div>
  ) : null;

  const speakerContent = speaker ? (
    <span
      className={[
        speakerStyle.name,
        speakerDisplayStyle?.className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={speakerNameStyle}
    >
      {speaker.name}:{isGridLayout ? null : " "}
    </span>
  ) : null;

  const primaryText = (
    <>
      {languageLabel && (
        <span className={style.text.languageBadge}>{languageLabel}</span>
      )}
      <span className={textClassName} style={textStyle}>
        {textContent}
      </span>
    </>
  );

  const text = isGridLayout ? (
    <>
      <div>{primaryText}</div>
      {translations}
    </>
  ) : (
    primaryText
  );

  return (
    <ScriptLineFrame
      className={speakerStyle.container}
      topSlot={topSlot}
      bottomSlot={bottomSlot}
    >
      <ScriptLineRow
        playControl={playControl}
        speaker={speakerContent}
        text={text}
        layoutVariant={layoutVariant}
        className={[style.text.line, rowClassName].filter(Boolean).join(" ")}
      />
    </ScriptLineFrame>
  );
}
