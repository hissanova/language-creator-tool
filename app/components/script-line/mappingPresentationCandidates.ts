import type { TextLine, TextMappingPayload } from "../../types/core/textLine";
import type {
  MappingPresentationCandidate,
  MappingPresentationFallbackReason,
  MappingSource,
  MappingSourceRange,
} from "../../types/viewer/mappingPresentation";
import { getSelectorRange } from "./resolveAnnotatedTextSegments";

function resolveSource(
  textLine: TextLine,
  selectorId: string,
): { range?: MappingSourceRange; reason?: MappingPresentationFallbackReason } {
  const selector = textLine.selectorRecord?.[selectorId];
  if (!selector) return { reason: "missing-selector" };
  if (selector.selectorType !== "range") return { reason: "unsupported-selector" };
  const range = getSelectorRange(selector, textLine.content.text);
  return range ? { range: { start: range.start, end: range.end } } : { reason: "invalid-range" };
}

/** Collect only mappings attached directly to this canonical source line. */
export function collectMappingPresentationCandidates(
  textLine: TextLine,
): readonly MappingPresentationCandidate[] {
  const candidates: MappingPresentationCandidate[] = [];
  const seenIds = new Set<string>();
  const add = (
    mapping: TextMappingPayload,
    source: MappingSource,
    resolution: { range?: MappingSourceRange; reason?: MappingPresentationFallbackReason },
  ) => {
    if (seenIds.has(mapping.id)) return;
    seenIds.add(mapping.id);
    candidates.push({
      mapping,
      source,
      inputOrder: candidates.length,
      range: resolution.range,
      sourceFallback: resolution.reason,
    });
  };
  const addBundle = (sourceId: string, mappings: readonly TextMappingPayload[]) => {
    const source: MappingSource = { kind: "selector", selectorId: sourceId };
    const resolution = resolveSource(textLine, sourceId);
    mappings.forEach((mapping) => add(mapping, source, resolution));
  };

  textLine.selectedTextMappings?.forEach((bundle) => addBundle(bundle.source, bundle.mappings));
  textLine.textLineMappings?.forEach((mapping) =>
    add(mapping, { kind: "wholeLine" }, textLine.content.text.length
      ? { range: { start: 0, end: textLine.content.text.length } }
      : { reason: "invalid-range" }),
  );
  textLine.selections?.forEach((selection) => {
    selection.localSelectedTextMappings?.forEach((bundle) =>
      addBundle(bundle.source, bundle.mappings),
    );
    selection.selectionMappings?.forEach((mapping) => {
      if (selection.selectorIds.length !== 1) {
        add(mapping, { kind: "selection", selectionId: selection.id },
          { reason: "unsupported-selection-source" });
        return;
      }
      const selectorId = selection.selectorIds[0];
      add(mapping, { kind: "selector", selectorId }, resolveSource(textLine, selectorId));
    });
  });
  return candidates;
}
