import type { ReactNode } from "react";

type Props = {
  text: ReactNode;
  title?: string;
  className?: string;
};

export function HoverWord({ text, title, className }: Props) {
  return (
    <span
      className={className}
      title={title}
    >
      {text}
    </span>
  );
}
