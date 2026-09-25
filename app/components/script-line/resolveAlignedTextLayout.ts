import type { MappingPresentationResult } from "../../types/viewer/mappingPresentation";
import { resolveMappedTextLayout, type MappedTextLayout } from "./resolveMappedTextLayout";

/** @deprecated Use the unified mapped-text layout. */
export type AlignedTextLayout = MappedTextLayout;

/** @deprecated Use resolveMappedTextLayout. */
export function resolveAlignedTextLayout(sourceText: string, resolved: MappingPresentationResult) {
  return resolveMappedTextLayout(sourceText, resolved);
}
