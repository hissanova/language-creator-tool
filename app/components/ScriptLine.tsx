import type { CSSProperties, ReactNode } from "react";
import type { TimeSpan } from "../types/core/common";
import type { Speaker } from "../types/core/document";
import type { ViewerStyle } from "../types/viewerStyle";

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
  trailingControl?: ReactNode;
  belowContent?: ReactNode;
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
  trailingControl,
  belowContent,
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
        isGridLayout ? "col-start-1 self-start align-middle" : "mr-2 align-middle",
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
        isGridLayout ? "col-start-2" : undefined,
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

  const lineContent = (
    <>
      {playControl}
      {speakerContent}
      {isGridLayout ? (
        <div className="col-start-3 min-w-0">
          <div>{primaryText}</div>
          {translations}
        </div>
      ) : (
        primaryText
      )}
      {trailingControl}
    </>
  );

  return (
    <div className={speakerStyle.container}>
      {isGridLayout ? (
        <div
          className={`${style.text.line} grid grid-cols-[auto_auto_minmax(0,1fr)_auto] items-start gap-x-2`}
        >
          {lineContent}
        </div>
      ) : (
        <p className={style.text.line}>{lineContent}</p>
      )}
      {belowContent}
    </div>
  );
}
