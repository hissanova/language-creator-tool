import type { CSSProperties, ReactNode } from "react";

type Props = {
  text: ReactNode;
  title?: string;
  className?: string;
  style?: CSSProperties;
};

export function HoverWord({ text, title, className, style }: Props) {
  return (
    <span
      className={className}
      style={style}
      title={title}
    >
      {text}
    </span>
  );
}
