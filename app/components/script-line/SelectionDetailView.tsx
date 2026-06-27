import type { Selection, TextLine, TextMappingPayload } from "../../types/core/textLine";
import {
  formatRange,
  getSelectorRange,
  mappingText,
  refText,
  type LineRef,
  type SelectorAnnotation,
} from "./coreQueries";

type SelectionDetailViewProps = {
  variant?: "developer" | "learner";
  selection: Selection;
  textLine: TextLine;
  annotations: SelectorAnnotation[];
  translationLanguageId: string;
};

export function MappingDetailView({
  mapping,
}: {
  mapping: TextMappingPayload;
}) {
  return (
    <div className="rounded border border-emerald-200 bg-emerald-50/60 p-2 text-gray-950">
      <div className="mb-1 flex flex-wrap items-center gap-2">
        <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-900">
          mapping
        </span>
        <span className="font-semibold text-gray-900">{mapping.mappingType}</span>
        <span className="text-xs text-gray-700">{mapping.id}</span>
      </div>
      <div className="rounded bg-white px-2 py-1">{mappingText(mapping)}</div>
    </div>
  );
}

export function RefDetailView({
  refValue,
  translationLanguageId,
}: {
  refValue: LineRef;
  translationLanguageId: string;
}) {
  const text = refText(refValue, translationLanguageId);

  if (text) {
    return (
      <div className="rounded border border-gray-200 bg-white px-2 py-1 text-gray-950">
        <span className="font-semibold text-gray-900">{refValue.body.type}: </span>
        <span>{text}</span>
      </div>
    );
  }

  if (refValue.body.type === "alignment") {
    return (
      <div className="rounded border border-gray-200 bg-white px-2 py-1 text-gray-950">
        <span className="font-semibold text-gray-900">alignment: </span>
        <span>
          {refValue.body.interval.start}
          {refValue.body.interval.end != null ? `-${refValue.body.interval.end}` : ""}
        </span>
      </div>
    );
  }

  if (refValue.body.type === "speaker") {
    return (
      <div className="rounded border border-gray-200 bg-white px-2 py-1 text-gray-950">
        <span className="font-semibold text-gray-900">speaker: </span>
        <span>{refValue.body.speakerId}</span>
      </div>
    );
  }

  return null;
}

export function SelectedTextAnnotationView({
  annotation,
  translationLanguageId,
}: {
  annotation: SelectorAnnotation;
  translationLanguageId: string;
}) {
  return (
    <div className="rounded border border-sky-200 bg-sky-50/70 p-3 text-gray-950">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className="rounded bg-sky-100 px-2 py-0.5 text-xs font-semibold text-sky-950">
          selector
        </span>
        <span className="font-semibold text-gray-950">{annotation.selectedText}</span>
        <span className="text-xs text-gray-700">{annotation.selectorId}</span>
        <span className="text-xs text-gray-700">range: {formatRange(annotation.selector)}</span>
      </div>

      {annotation.mappings.length ? (
        <div className="mb-2 space-y-2">
          {annotation.mappings.map((mapping) => (
            <MappingDetailView key={mapping.id} mapping={mapping} />
          ))}
        </div>
      ) : null}

      {annotation.refs.length ? (
        <div className="space-y-1">
          {annotation.refs.map((refValue) => (
            <RefDetailView
              key={refValue.id}
              refValue={refValue}
              translationLanguageId={translationLanguageId}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function SelectionDetailView({
  variant,
  selection,
  textLine,
  annotations,
  translationLanguageId,
}: SelectionDetailViewProps) {
  void variant;

  const selectorTexts = selection.selectorIds
    .map((selectorId) => {
      const selector = textLine.selectorRecord?.[selectorId];
      const range = selector ? getSelectorRange(selector, textLine.content.text) : undefined;
      return {
        selectorId,
        text: range ? textLine.content.text.slice(range.start, range.end) : undefined,
      };
    });
  const localRefCount = selection.localSelectedTextRefs?.reduce(
    (count, bundle) => count + bundle.attachments.length,
    0
  ) ?? 0;
  const selectionAnnotations = annotations.filter(
    (annotation) =>
      annotation.selection?.id === selection.id ||
      (!annotation.selection && selection.selectorIds.includes(annotation.selectorId))
  );

  return (
    <div className="rounded border border-violet-200 bg-violet-50/70 p-3 text-gray-950">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className="rounded bg-violet-100 px-2 py-0.5 text-xs font-semibold text-violet-950">
          selection
        </span>
        <span className="font-semibold text-gray-950">{selection.label ?? selection.selectionType}</span>
        <span className="text-xs text-gray-700">{selection.id}</span>
      </div>

      <div className="mb-2 flex flex-wrap gap-1">
        {selectorTexts.map(({ selectorId, text }) => (
          <span key={selectorId} className="rounded bg-white px-2 py-0.5 text-xs text-gray-800">
            {text ?? selectorId}
          </span>
        ))}
      </div>

      {selection.selectionMappings?.length ? (
        <div className="mb-2 space-y-2">
          <div className="text-xs font-semibold uppercase text-gray-700">Whole-selection mappings</div>
          {selection.selectionMappings.map((mapping) => (
            <MappingDetailView key={mapping.id} mapping={mapping} />
          ))}
        </div>
      ) : null}

      {selection.selectionRefs?.length ? (
        <div className="mb-2 space-y-1">
          <div className="text-xs font-semibold uppercase text-gray-700">Whole-selection refs</div>
          {selection.selectionRefs.map((refValue) => (
            <RefDetailView
              key={refValue.id}
              refValue={refValue}
              translationLanguageId={translationLanguageId}
            />
          ))}
        </div>
      ) : null}

      {localRefCount ? (
        <div className="space-y-1">
          <div className="text-xs font-semibold uppercase text-gray-700">Selection-local selected text refs</div>
          {selection.localSelectedTextRefs?.map((bundle) => (
            <div key={bundle.id} className="rounded bg-white/80 p-2">
              <div className="mb-1 text-xs font-semibold text-gray-700">{bundle.source}</div>
              <div className="space-y-1">
                {bundle.attachments.map((attachment) => (
                  <RefDetailView
                    key={attachment.id}
                    refValue={attachment.ref}
                    translationLanguageId={translationLanguageId}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {selectionAnnotations.length ? (
        <div className="mt-2 space-y-2">
          <div className="text-xs font-semibold uppercase text-gray-700">Selection-local selected text mappings</div>
          {selectionAnnotations.map((annotation) => (
            <SelectedTextAnnotationView
              key={annotation.selectorId}
              annotation={annotation}
              translationLanguageId={translationLanguageId}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
