import type { MappingPresentationFallback, MappingPresentationItem, MappingPresentationResult } from "../../types/viewer/mappingPresentation";

export type AlignedSourceChunk = {
  readonly start: number;
  readonly end: number;
  readonly text: string;
  readonly above: readonly MappingPresentationItem[];
  readonly below: readonly MappingPresentationItem[];
};

export type AlignedTextLayout = {
  readonly chunks: readonly AlignedSourceChunk[];
  readonly wholeLineAbove: readonly MappingPresentationItem[];
  readonly wholeLineBelow: readonly MappingPresentationItem[];
  readonly fallbacks: readonly MappingPresentationFallback[];
};

export function resolveAlignedTextLayout(sourceText: string, resolved: MappingPresentationResult): AlignedTextLayout {
  const aligned = [...resolved.above, ...resolved.below].filter((item) => item.presentation === "alignedText");
  const selectors = aligned.filter((item) => item.source.kind === "selector");
  const groups = new Map<string, { start: number; end: number; above: MappingPresentationItem[]; below: MappingPresentationItem[] }>();
  for (const item of selectors) {
    const key = `${item.range.start}:${item.range.end}`;
    const group = groups.get(key) ?? { start: item.range.start, end: item.range.end, above: [], below: [] };
    group[item.placement].push(item);
    groups.set(key, group);
  }
  const ranges = [...groups.values()].sort((a, b) => a.start - b.start || a.end - b.end);
  const conflicts = new Set<typeof ranges[number]>();
  for (let i = 0; i < ranges.length; i++) {
    for (let j = i + 1; j < ranges.length && ranges[j].start < ranges[i].end; j++) {
      conflicts.add(ranges[i]);
      conflicts.add(ranges[j]);
    }
  }
  const fallbacks: MappingPresentationFallback[] = [...resolved.fallbacks];
  for (const group of conflicts) {
    for (const item of [...group.above, ...group.below]) {
      fallbacks.push({ mappingId: item.mappingId, mappingType: item.mappingType, source: item.source,
        reason: "overlapping-ranges", inputOrder: item.inputOrder });
    }
  }
  const chunks: AlignedSourceChunk[] = [];
  let cursor = 0;
  const add = (start: number, end: number, above: readonly MappingPresentationItem[] = [], below: readonly MappingPresentationItem[] = []) => {
    if (end > start) chunks.push({ start, end, text: sourceText.slice(start, end), above, below });
  };
  for (const group of ranges) {
    if (conflicts.has(group)) continue;
    add(cursor, group.start);
    add(group.start, group.end, group.above, group.below);
    cursor = group.end;
  }
  add(cursor, sourceText.length);
  return {
    chunks,
    wholeLineAbove: resolved.above.filter((item) => item.presentation === "alignedText" && item.source.kind === "wholeLine"),
    wholeLineBelow: resolved.below.filter((item) => item.presentation === "alignedText" && item.source.kind === "wholeLine"),
    fallbacks,
  };
}
