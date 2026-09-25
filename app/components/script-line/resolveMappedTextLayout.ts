import type {
  MappingPresentationFallback,
  MappingPresentationItem,
  MappingPresentationResult,
} from "../../types/viewer/mappingPresentation";

export type MappedSourceChunk = {
  readonly start: number;
  readonly end: number;
  readonly text: string;
  readonly ruby?: MappingPresentationItem;
  readonly alignedAbove: readonly MappingPresentationItem[];
  readonly alignedBelow: readonly MappingPresentationItem[];
};

export type MappedTextLayout = {
  readonly chunks: readonly MappedSourceChunk[];
  readonly wholeLineAbove: readonly MappingPresentationItem[];
  readonly wholeLineBelow: readonly MappingPresentationItem[];
  readonly fallbacks: readonly MappingPresentationFallback[];
};

type RangeGroup = {
  readonly start: number;
  readonly end: number;
  readonly ruby: MappingPresentationItem[];
  readonly alignedAbove: MappingPresentationItem[];
  readonly alignedBelow: MappingPresentationItem[];
};

function fallbackFor(
  item: MappingPresentationItem,
  reason: MappingPresentationFallback["reason"],
): MappingPresentationFallback {
  return {
    mappingId: item.mappingId,
    mappingType: item.mappingType,
    source: item.source,
    reason,
    inputOrder: item.inputOrder,
  };
}

/** Partition canonical source once for every inline mapping presentation. */
export function resolveMappedTextLayout(
  sourceText: string,
  resolved: MappingPresentationResult,
): MappedTextLayout {
  const groups = new Map<string, RangeGroup>();
  const fallbacks: MappingPresentationFallback[] = [...resolved.fallbacks];

  for (const item of [...resolved.above, ...resolved.below]) {
    const isInline = item.source.kind === "selector" || item.presentation === "ruby";
    if (!isInline) continue;

    const key = `${item.range.start}:${item.range.end}`;
    const group = groups.get(key) ?? {
      start: item.range.start,
      end: item.range.end,
      ruby: [],
      alignedAbove: [],
      alignedBelow: [],
    };
    if (item.presentation === "ruby") {
      group.ruby.push(item);
    } else if (item.placement === "above") {
      group.alignedAbove.push(item);
    } else {
      group.alignedBelow.push(item);
    }
    groups.set(key, group);
  }

  const ranges = [...groups.values()].sort((a, b) => a.start - b.start || a.end - b.end);
  for (const group of ranges) {
    if (group.ruby.length <= 1) continue;
    fallbacks.push(...group.ruby.map((item) => fallbackFor(item, "multiple-ruby-annotations")));
    group.ruby.length = 0;
  }

  const activeRanges = ranges.filter((group) =>
    group.ruby.length > 0 || group.alignedAbove.length > 0 || group.alignedBelow.length > 0
  );
  const conflicts = new Set<RangeGroup>();
  for (let i = 0; i < activeRanges.length; i++) {
    for (let j = i + 1; j < activeRanges.length && activeRanges[j].start < activeRanges[i].end; j++) {
      conflicts.add(activeRanges[i]);
      conflicts.add(activeRanges[j]);
    }
  }
  for (const group of activeRanges) {
    if (!conflicts.has(group)) continue;
    const items = [...group.ruby, ...group.alignedAbove, ...group.alignedBelow];
    fallbacks.push(...items.map((item) => fallbackFor(item, "overlapping-ranges")));
  }

  const chunks: MappedSourceChunk[] = [];
  const add = (
    start: number,
    end: number,
    ruby?: MappingPresentationItem,
    alignedAbove: readonly MappingPresentationItem[] = [],
    alignedBelow: readonly MappingPresentationItem[] = [],
  ) => {
    if (end <= start) return;
    chunks.push({
      start,
      end,
      text: sourceText.slice(start, end),
      ruby,
      alignedAbove,
      alignedBelow,
    });
  };

  let cursor = 0;
  for (const group of activeRanges) {
    if (conflicts.has(group)) continue;
    add(cursor, group.start);
    add(group.start, group.end, group.ruby[0], group.alignedAbove, group.alignedBelow);
    cursor = group.end;
  }
  add(cursor, sourceText.length);

  return {
    chunks,
    wholeLineAbove: resolved.above.filter(
      (item) => item.presentation === "alignedText" && item.source.kind === "wholeLine",
    ),
    wholeLineBelow: resolved.below.filter(
      (item) => item.presentation === "alignedText" && item.source.kind === "wholeLine",
    ),
    fallbacks,
  };
}
