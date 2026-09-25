import type { CSSProperties, ReactNode } from "react";
import type { MappedTextLayout } from "./resolveMappedTextLayout";

type Props = {
  layout: MappedTextLayout;
  renderSourceRange: (start: number, end: number) => ReactNode;
};

const underRubyStyle: CSSProperties = { rubyPosition: "under" };

export function MappedTextRenderer({ layout, renderSourceRange }: Props) {
  return layout.chunks.map((chunk) => {
    const sourceNode = renderSourceRange(chunk.start, chunk.end);
    const annotatedSource = chunk.ruby ? (
      <ruby style={chunk.ruby.placement === "below" ? underRubyStyle : undefined}>
        {sourceNode}
        <rp>(</rp>
        <rt>{chunk.ruby.mappedText.text}</rt>
        <rp>)</rp>
      </ruby>
    ) : sourceNode;

    if (!chunk.alignedAbove.length && !chunk.alignedBelow.length) {
      return <span key={`${chunk.start}:${chunk.end}`}>{annotatedSource}</span>;
    }
    return (
      // An inline table takes its baseline from the first row. Captions add space above or below it.
      <span key={`${chunk.start}:${chunk.end}`} className="inline-table align-baseline whitespace-nowrap">
        <span className="table-row">
          <span className="table-cell text-left leading-normal">{annotatedSource}</span>
        </span>
        {chunk.alignedAbove.length > 0 && <span className="table-caption caption-top text-center text-[0.7em] leading-tight">
          {chunk.alignedAbove.map((item) => <span key={item.mappingId} className="block">{item.mappedText.text}</span>)}
        </span>}
        {chunk.alignedBelow.length > 0 && <span className="table-caption caption-bottom text-center text-[0.7em] leading-tight">
          {chunk.alignedBelow.map((item) => <span key={item.mappingId} className="block">{item.mappedText.text}</span>)}
        </span>}
      </span>
    );
  });
}
