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
      <span key={chunk.start} className="inline-grid align-baseline text-center leading-tight whitespace-nowrap">
        <span className="col-start-1 row-start-2 text-left leading-normal">{renderSourceRange(chunk.start, chunk.end)}</span>
        {chunk.above.length > 0 && <span className="col-start-1 row-start-1 flex flex-col items-center text-[0.7em] leading-tight">
          {chunk.above.map((item) => <span key={item.mappingId}>{item.mappedText.text}</span>)}
        </span>}
        {chunk.below.length > 0 && <span className="col-start-1 row-start-3 flex flex-col items-center text-[0.7em] leading-tight">
          {chunk.below.map((item) => <span key={item.mappingId}>{item.mappedText.text}</span>)}
        </span>}
      </span>
    );
  });
}
