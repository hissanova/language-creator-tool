import type { AriaAttributes, CSSProperties, ReactNode } from "react";

export type ScriptLineFrameProps = {
  topSlot?: ReactNode;
  children: ReactNode;
  bottomSlot?: ReactNode;
  className?: string;
  style?: CSSProperties;
  ariaCurrent?: AriaAttributes["aria-current"];
};

export function ScriptLineFrame({
  topSlot,
  children,
  bottomSlot,
  className,
  style,
  ariaCurrent,
}: ScriptLineFrameProps) {
  return (
    <div
      className={["flex w-full min-w-0 flex-col", className]
        .filter(Boolean)
        .join(" ")}
      style={style}
      aria-current={ariaCurrent}
    >
      {topSlot != null ? <div className="min-w-0">{topSlot}</div> : null}
      {children}
      {bottomSlot != null ? (
        <div className="relative min-w-0">{bottomSlot}</div>
      ) : null}
    </div>
  );
}
