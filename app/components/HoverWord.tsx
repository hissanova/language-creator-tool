type Props = {
  text: string;
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
