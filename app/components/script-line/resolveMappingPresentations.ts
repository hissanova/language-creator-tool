import type { TextLine, TextMappingPayload } from "../../types/core/textLine";
import type {
  MappingPresentationCandidate,
  MappingPresentationFallbackReason,
  MappingPresentationItem,
  MappingPresentationResult,
  MappingPresentationRule,
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

function matchesFilter(value: string, filter: readonly string[] | undefined): boolean {
  return filter === undefined || filter.includes(value);
}

export function matchingMappingPresentationRules(
  mapping: TextMappingPayload,
  rules: readonly MappingPresentationRule[],
  sourceKind?: "wholeLine" | "selector",
): readonly MappingPresentationRule[] {
  return rules.filter((rule) =>
    matchesFilter(mapping.mappingType, rule.match.mappingTypes) &&
    matchesFilter(mapping.image.content.languageId, rule.match.languageIds) &&
    matchesFilter(mapping.image.content.formId, rule.match.formIds) &&
    (rule.match.sourceKinds === undefined ||
      (sourceKind !== undefined && rule.match.sourceKinds.includes(sourceKind))),
  );
}

function compareItems(a: MappingPresentationItem, b: MappingPresentationItem): number {
  return a.range.start - b.range.start ||
    a.range.end - b.range.end ||
    a.order - b.order ||
    a.inputOrder - b.inputOrder ||
    (a.mappingId < b.mappingId ? -1 : a.mappingId > b.mappingId ? 1 : 0);
}

/** Resolve inline eligibility without changing Core data or selecting a display form. */
export function resolveMappingPresentations(
  textLine: TextLine,
  rules: readonly MappingPresentationRule[],
): MappingPresentationResult {
  const above: MappingPresentationItem[] = [];
  const below: MappingPresentationItem[] = [];
  const fallbacks: MappingPresentationResult["fallbacks"][number][] = [];

  for (const candidate of collectMappingPresentationCandidates(textLine)) {
    const { mapping, source, inputOrder } = candidate;
    const fallback = (
      reason: MappingPresentationFallbackReason,
      matchingRuleIds?: readonly string[],
    ) => fallbacks.push({ mappingId: mapping.id, mappingType: mapping.mappingType,
      source, reason, matchingRuleIds, inputOrder });

    if (candidate.sourceFallback) {
      fallback(candidate.sourceFallback);
      continue;
    }
    if (source.kind === "selection") {
      fallback("unsupported-selection-source");
      continue;
    }
    const matches = matchingMappingPresentationRules(mapping, rules, source.kind);
    if (matches.length === 0) {
      fallback("unmatched");
      continue;
    }
    if (matches.length > 1) {
      fallback("conflicting-rules", matches.map((rule) => rule.id));
      continue;
    }
    const rule = matches[0];
    const item: MappingPresentationItem = {
      ruleId: rule.id,
      mappingId: mapping.id,
      mappingType: mapping.mappingType,
      mappedText: { ...mapping.image.content },
      source,
      range: candidate.range!,
      presentation: rule.presentation,
      placement: rule.placement,
      order: rule.order ?? 0,
      inputOrder,
    };
    (rule.placement === "above" ? above : below).push(item);
  }
  above.sort(compareItems);
  below.sort(compareItems);
  return { above, below, fallbacks };
}
