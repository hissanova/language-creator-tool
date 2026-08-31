import type { CSSProperties, ReactNode } from "react";
import type { TimeSpan } from "../types/core/common";
import type { Speaker } from "../types/core/document";
import type { ViewerStyle } from "../types/viewerStyle";
import { ScriptLineFrame } from "./script-line/ScriptLineFrame";
import { ScriptLineRow } from "./script-line/ScriptLineRow";

type Props = {
  speaker?: Speaker;
  speakerId?: string;
  alignment?: TimeSpan;
  canPlay?: boolean;
  onPlay?: (interval: TimeSpan) => void;
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
  alignment,
  canPlay = false,
  onPlay,
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

  const playControl = canPlay && alignment ? (
    <button
      onClick={() => onPlay?.(alignment)}
      className={[
        style.layout.playButton,
        isGridLayout ? "align-middle" : "mr-2 align-middle",
      ].join(" ")}
      aria-label="Play line"
      title="Play line"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        width="16"
        height="16"
        fill="currentColor"
        aria-hidden
      >
        <path d="M8 5v14l11-7z" />
      </svg>
    </button>
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
