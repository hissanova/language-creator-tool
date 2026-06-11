type Props = {
  text: string;
  meaning: string;
};

export function HoverWord({ text, meaning }: Props) {
  return (
    <span
      className="cursor-help rounded border-b border-dotted border-gray-500 bg-blue-400 px-1"
      title={meaning}
    >
      {text}
    </span>
  );
}