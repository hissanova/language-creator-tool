import type { ReactNode } from "react";
import type { AlignedTextLayout } from "./resolveAlignedTextLayout";

type Props = {
  layout: AlignedTextLayout;
  renderSourceRange: (start: number, end: number) => ReactNode;
};

export function AlignedTextRenderer({ layout, renderSourceRange }: Props) {
  return layout.chunks.map((chunk) => {
    if (!chunk.above.length && !chunk.below.length) {
      return <span key={chunk.start}>{renderSourceRange(chunk.start, chunk.end)}</span>;
    }
    return (
      // An inline table takes its baseline from the first row. Captions add space above or below it.
      <span key={chunk.start} className="inline-table align-baseline whitespace-nowrap">
        <span className="table-row">
          <span className="table-cell text-left leading-normal">{renderSourceRange(chunk.start, chunk.end)}</span>
        </span>
        {chunk.above.length > 0 && <span className="table-caption caption-top text-center text-[0.7em] leading-tight">
          {chunk.above.map((item) => <span key={item.mappingId} className="block">{item.mappedText.text}</span>)}
        </span>}
        {chunk.below.length > 0 && <span className="table-caption caption-bottom text-center text-[0.7em] leading-tight">
          {chunk.below.map((item) => <span key={item.mappingId} className="block">{item.mappedText.text}</span>)}
        </span>}
      </span>
    );
  });
}
