import type { Selector } from "../../types/core/textLine";

type AnnotationWithSelector = {
  selector: Selector;
};

export type ResolvedTextSegment<TAnnotation> = {
  start: number;
  end: number;
  text: string;
  annotations: readonly TAnnotation[];
};

export function getSelectorRange(selector: Selector, text: string) {
  if (selector.selectorType !== "range") return undefined;

  const { range } = selector;
  if (range.start < 0 || range.end <= range.start || range.end > text.length) {
    return undefined;
  }

  return range;
}

/**
 * Splits text at every valid range boundary and associates each resulting
 * segment with the annotations whose ranges contain it.
 *
 * Range validation deliberately matches the viewer's existing behavior:
 * offsets are JavaScript UTF-16 indexes, end is exclusive, and empty or
 * out-of-bounds ranges (as well as non-range selectors) are ignored.
 */
export function resolveAnnotatedTextSegments<
  TAnnotation extends AnnotationWithSelector,
>(
  text: string,
  annotations: readonly TAnnotation[],
): ResolvedTextSegment<TAnnotation>[] {
  if (!text.length) return [];

  const resolvedAnnotations = annotations
    .map((annotation, inputIndex) => ({
      annotation,
      inputIndex,
      range: getSelectorRange(annotation.selector, text),
    }))
    .filter(
      (item): item is {
        annotation: TAnnotation;
        inputIndex: number;
        range: { start: number; end: number };
      } => Boolean(item.range),
    )
    .sort(
      (a, b) =>
        a.range.start - b.range.start ||
        b.range.end - a.range.end ||
        a.inputIndex - b.inputIndex,
    );

  const boundaries = new Set<number>([0, text.length]);
  resolvedAnnotations.forEach(({ range }) => {
    boundaries.add(range.start);
    boundaries.add(range.end);
  });

  const sortedBoundaries = Array.from(boundaries).sort((a, b) => a - b);

  return sortedBoundaries.slice(0, -1).map((start, index) => {
    const end = sortedBoundaries[index + 1];
    const activeAnnotations = resolvedAnnotations
      .filter(({ range }) => range.start <= start && end <= range.end)
      .map(({ annotation }) => annotation);

    return {
      start,
      end,
      text: text.slice(start, end),
      annotations: activeAnnotations,
    };
  });
}
