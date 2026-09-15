import type { CSSProperties, ReactNode } from "react";
import type { Speaker } from "../types/core/document";
import type { ScriptLinePresentation, ViewerStyle } from "../types/viewerStyle";
import type { LinePlaybackRange } from "./playback/playbackState";
import { LockIcon, PlayIcon } from "./playback/PlaybackIcons";
import { linePlaybackButtonClass } from "./playback/playbackButtonStyles";
import { releasePlaybackButtonFocusOnPointerUp } from "./playback/playbackButtonFocus";
import { activateLinePlaybackControl } from "./playback/linePlaybackControl";
import { ScriptLineFrame } from "./script-line/ScriptLineFrame";
import { ScriptLineRow } from "./script-line/ScriptLineRow";

type Props = {
  speaker?: Speaker;
  linePresentation: ScriptLinePresentation;
  playbackRange?: LinePlaybackRange | null;
  hasPlaybackTiming?: boolean;
  isRangeLocked?: boolean;
  isCurrentPlaybackLine?: boolean;
  onPlayLine?: (range: LinePlaybackRange) => void;
  onToggleLineLock?: (range: LinePlaybackRange) => void;
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
  linePresentation,
  playbackRange,
  hasPlaybackTiming = false,
  isRangeLocked = false,
  isCurrentPlaybackLine = false,
  onPlayLine,
  onToggleLineLock,
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
  const labelStyle: CSSProperties = {
    ...linePresentation.labelStyle,
    color: linePresentation.labelColor,
  };
  const isGridLayout = layoutVariant === "grid";
  const disabledTitle = "Line timing is invalid or its audio cannot be resolved";

  const playControl = hasPlaybackTiming ? (
    <div className={isGridLayout ? "-mr-0.5 flex gap-1" : "mr-1.5 inline-flex gap-1 align-middle"}>
      <button
        type="button"
        disabled={!playbackRange}
        onClick={() => activateLinePlaybackControl({ range: playbackRange, playLine: onPlayLine })}
        onPointerUp={releasePlaybackButtonFocusOnPointerUp}
        className={linePlaybackButtonClass({ disabled: !playbackRange })}
        aria-label="Play from this line"
        title={playbackRange ? "Play from this line" : disabledTitle}
      >
        <PlayIcon className="h-4 w-4" />
      </button>
      <button
        type="button"
        disabled={!playbackRange}
        aria-pressed={isRangeLocked}
        data-line-control="lock"
        data-state={isRangeLocked ? "on" : "off"}
        onClick={() => playbackRange && onToggleLineLock?.(playbackRange)}
        onPointerUp={releasePlaybackButtonFocusOnPointerUp}
        className={linePlaybackButtonClass({
          pressed: isRangeLocked,
          disabled: !playbackRange,
        })}
        aria-label={isRangeLocked ? "Unlock playback range" : "Lock playback range to this line"}
        title={playbackRange
          ? isRangeLocked ? "Unlock playback range" : "Lock playback range to this line"
          : disabledTitle}
      >
        <LockIcon locked={isRangeLocked} className="h-4 w-4" />
      </button>
    </div>
  ) : null;

  const speakerContent = speaker ? (
    <span
      className={[
        speakerStyle.name,
        linePresentation.labelClassName,
      ]
        .filter(Boolean)
        .join(" ")}
      style={labelStyle}
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
      className={[speakerStyle.container, linePresentation.frameClassName]
        .filter(Boolean)
        .join(" ")}
      style={{
        backgroundColor: linePresentation.backgroundColor,
        ...linePresentation.frameStyle,
      }}
      ariaCurrent={isCurrentPlaybackLine ? "true" : undefined}
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
