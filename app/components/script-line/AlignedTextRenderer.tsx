import type { ReactNode } from "react";
import { MappedTextRenderer } from "./MappedTextRenderer";
import type { AlignedTextLayout } from "./resolveAlignedTextLayout";

type Props = {
  layout: AlignedTextLayout;
  renderSourceRange: (start: number, end: number) => ReactNode;
};

export function AlignedTextRenderer({ layout, renderSourceRange }: Props) {
  return <MappedTextRenderer layout={layout} renderSourceRange={renderSourceRange} />;
}
