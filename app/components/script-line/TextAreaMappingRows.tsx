import type { MappingPresentationItem } from "../../types/viewer/mappingPresentation";

export function TextAreaMappingRows({ items }: { items: readonly MappingPresentationItem[] }) {
  return items.map((item) => <p key={item.mappingId} className="text-[0.8em] leading-tight">{item.mappedText.text}</p>);
}
