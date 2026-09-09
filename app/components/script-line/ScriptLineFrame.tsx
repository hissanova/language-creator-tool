import type { CSSProperties, ReactNode } from "react";

export type ScriptLineFrameProps = {
  topSlot?: ReactNode;
  children: ReactNode;
  bottomSlot?: ReactNode;
  className?: string;
  style?: CSSProperties;
};

export function ScriptLineFrame({
  topSlot,
  children,
  bottomSlot,
  className,
  style,
}: ScriptLineFrameProps) {
  return (
    <div
      className={["flex w-full min-w-0 flex-col", className]
        .filter(Boolean)
        .join(" ")}
      style={style}
    >
      {topSlot != null ? <div className="min-w-0">{topSlot}</div> : null}
      {children}
      {bottomSlot != null ? (
        <div className="relative min-w-0">{bottomSlot}</div>
      ) : null}
    </div>
  );
}
