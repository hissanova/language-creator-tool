import type { ReactNode } from "react";

export type ScriptLineRowProps = {
  playControl?: ReactNode;
  speaker?: ReactNode;
  text: ReactNode;
  layoutVariant: "inline" | "grid";
  className?: string;
};

export function ScriptLineRow({
  playControl,
  speaker,
  text,
  layoutVariant,
  className,
}: ScriptLineRowProps) {
  if (layoutVariant === "grid") {
    return (
      <div
        className={[
          "grid w-full min-w-0 grid-cols-[auto_minmax(0,auto)_minmax(0,1fr)] items-start gap-x-2",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {playControl != null ? (
          <div className="col-start-1 self-start">{playControl}</div>
        ) : null}
        {speaker != null ? (
          <div className="col-start-2 min-w-0 break-words">{speaker}</div>
        ) : null}
        <div className="col-start-3 min-w-0">{text}</div>
      </div>
    );
  }

  return (
    <div className={["min-w-0", className].filter(Boolean).join(" ")}>
      {playControl}
      {speaker}
      {text}
    </div>
  );
}
