import type { CSSProperties } from "react";
import { HoverWord } from "./HoverWord";
import type { ResolvedTextSegment } from "./script-line/resolveAnnotatedTextSegments";

export type AnnotatedTextPresentation = {
  title?: string;
  className?: string;
  style?: CSSProperties;
};

type Props<TAnnotation> = {
  segments: readonly ResolvedTextSegment<TAnnotation>[];
  getAnnotationPresentation: (
    annotation: TAnnotation,
  ) => AnnotatedTextPresentation;
};

type RenderedSegment<TAnnotation> = Omit<
  ResolvedTextSegment<TAnnotation>,
  "annotations"
> & {
  annotation?: TAnnotation;
};

function selectRenderedSegments<TAnnotation>(
  segments: readonly ResolvedTextSegment<TAnnotation>[],
): RenderedSegment<TAnnotation>[] {
  const annotationRanges = new Map<
    TAnnotation,
    { annotation: TAnnotation; start: number; end: number; order: number }
  >();
  let order = 0;

  segments.forEach((segment) => {
    segment.annotations.forEach((annotation) => {
      const existing = annotationRanges.get(annotation);
      if (existing) {
        existing.start = Math.min(existing.start, segment.start);
        existing.end = Math.max(existing.end, segment.end);
        return;
      }

      annotationRanges.set(annotation, {
        annotation,
        start: segment.start,
        end: segment.end,
        order,
      });
      order += 1;
    });
  });

  const renderedAnnotations = new Set<TAnnotation>();
  let cursor = 0;
  Array.from(annotationRanges.values())
    .sort(
      (a, b) =>
        a.start - b.start || b.end - a.end || a.order - b.order,
    )
    .forEach(({ annotation, start, end }) => {
      if (start < cursor) return;
      renderedAnnotations.add(annotation);
      cursor = end;
    });

  return segments.reduce<RenderedSegment<TAnnotation>[]>((rendered, segment) => {
    const annotation = segment.annotations.find((candidate) =>
      renderedAnnotations.has(candidate),
    );
    const previous = rendered.at(-1);

    if (
      previous &&
      previous.end === segment.start &&
      previous.annotation === annotation
    ) {
      previous.end = segment.end;
      previous.text += segment.text;
      return rendered;
    }

    rendered.push({
      start: segment.start,
      end: segment.end,
      text: segment.text,
      annotation,
    });
    return rendered;
  }, []);
}

export function AnnotatedText<TAnnotation>({
  segments,
  getAnnotationPresentation,
}: Props<TAnnotation>) {
  return selectRenderedSegments(segments).map((segment) => {
    // The resolver preserves every active annotation. Rendering keeps the
    // previous non-overlapping greedy precedence so overlapping annotations do
    // not introduce nested markup or a new visual priority rule.
    const { annotation } = segment;
    if (!annotation) {
      return <span key={`plain-${segment.start}`}>{segment.text}</span>;
    }

    const presentation = getAnnotationPresentation(annotation);

    return (
      <HoverWord
        key={`annotation-${segment.start}-${segment.end}`}
        text={segment.text}
        title={presentation.title}
        className={presentation.className}
        style={presentation.style}
      />
    );
  });
}
