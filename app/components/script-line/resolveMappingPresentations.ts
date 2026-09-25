import type { TextLine, TextMappingPayload } from "../../types/core/textLine";
import type {
  MappingPresentationContext,
  MappingPresentationFallbackReason,
  MappingPresentationItem,
  MappingPresentationResult,
  MappingPresentationRule,
} from "../../types/viewer/mappingPresentation";
import { collectMappingPresentationCandidates } from "./mappingPresentationCandidates";

function matchesFilter(value: string, filter: readonly string[] | undefined): boolean {
  return filter === undefined || filter.includes(value);
}

function matchesFormFilter(
  value: string,
  filter: MappingPresentationRule["match"]["formIds"],
  context: MappingPresentationContext,
): boolean {
  if (filter === undefined || filter === "any") return true;
  if (filter === "currentForm") return value === context.selectedFormId;
  if (filter === "currentReading") {
    return context.selectedReadingFormId !== null && value === context.selectedReadingFormId;
  }
  return filter.includes(value);
}

export function matchingMappingPresentationRules(
  mapping: TextMappingPayload,
  rules: readonly MappingPresentationRule[],
  context: MappingPresentationContext,
  sourceKind?: "wholeLine" | "selector",
): readonly MappingPresentationRule[] {
  return rules.filter((rule) =>
    matchesFilter(mapping.mappingType, rule.match.mappingTypes) &&
    matchesFilter(mapping.image.content.languageId, rule.match.languageIds) &&
    matchesFormFilter(mapping.image.content.formId, rule.match.formIds, context) &&
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
  context: MappingPresentationContext,
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
    const matches = matchingMappingPresentationRules(mapping, rules, context, source.kind);
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
