import type { Selection, TextLine, TextMappingPayload } from "../../types/core/textLine";
import type { AnnotationPanelDisplayOptions } from "../../types/viewer";
import {
  formatRange,
  mappingText,
  refText,
  type LineRef,
  type SelectorAnnotation,
} from "./coreQueries";
import { getSelectorRange } from "./resolveAnnotatedTextSegments";
import { semanticTypeLabel } from "./semanticTypeLabel";

type SelectionDetailViewProps = {
  selection: Selection;
  textLine: TextLine;
  annotations: SelectorAnnotation[];
  translationLanguageId: string;
  options?: AnnotationPanelDisplayOptions;
  depth?: number;
};

export function MappingDetailView({
  mapping,
  options,
}: {
  mapping: TextMappingPayload;
  options?: AnnotationPanelDisplayOptions;
}) {
  const showCoreKindLabels = options?.showCoreKindLabels ?? true;
  const typeLabel = semanticTypeLabel(mapping.mappingType, options);
  const showIds = options?.showIds ?? true;

  return (
    <div className="rounded border border-emerald-200 bg-emerald-50/60 p-2 text-gray-950">
      <div className="mb-1 flex flex-wrap items-center gap-2">
        {showCoreKindLabels && (
          <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-900">
            mapping
          </span>
        )}
        {typeLabel && (
          <span className="font-semibold text-gray-900">{typeLabel}</span>
        )}
        {showIds && <span className="text-xs text-gray-700">{mapping.id}</span>}
      </div>
      <div className="rounded bg-white px-2 py-1">{mappingText(mapping)}</div>
    </div>
  );
}

export function RefDetailView({
  refValue,
  translationLanguageId,
  options,
}: {
  refValue: LineRef;
  translationLanguageId: string;
  options?: AnnotationPanelDisplayOptions;
}) {
  const text = refText(refValue, translationLanguageId);
  const typeLabel = semanticTypeLabel(refValue.body.type, options);

  if (text) {
    return (
      <div className="rounded border border-gray-200 bg-white px-2 py-1 text-gray-950">
        {typeLabel && (
          <span className="font-semibold text-gray-900">{typeLabel}: </span>
        )}
        <span>{text}</span>
      </div>
    );
  }

  if (refValue.body.type === "alignment") {
    return (
      <div className="rounded border border-gray-200 bg-white px-2 py-1 text-gray-950">
        {typeLabel && (
          <span className="font-semibold text-gray-900">{typeLabel}: </span>
        )}
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
        {typeLabel && (
          <span className="font-semibold text-gray-900">{typeLabel}: </span>
        )}
        <span>{refValue.body.speakerId}</span>
      </div>
    );
  }

  return null;
}

export function SelectedTextAnnotationView({
  annotation,
  translationLanguageId,
  options,
}: {
  annotation: SelectorAnnotation;
  translationLanguageId: string;
  options?: AnnotationPanelDisplayOptions;
}) {
  const showCoreKindLabels = options?.showCoreKindLabels ?? true;
  const showIds = options?.showIds ?? true;
  const showRanges = options?.showRanges ?? true;

  return (
    <div className="rounded border border-sky-200 bg-sky-50/70 p-3 text-gray-950">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        {showCoreKindLabels && (
          <span className="rounded bg-sky-100 px-2 py-0.5 text-xs font-semibold text-sky-950">
            selector
          </span>
        )}
        <span className="font-semibold text-gray-950">{annotation.selectedText}</span>
        {showIds && <span className="text-xs text-gray-700">{annotation.selectorId}</span>}
        {showRanges && (
          <span className="text-xs text-gray-700">range: {formatRange(annotation.selector)}</span>
        )}
      </div>

      {annotation.mappings.length ? (
        <div className="mb-2 space-y-2">
          {annotation.mappings.map((mapping) => (
            <MappingDetailView key={mapping.id} mapping={mapping} options={options} />
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
              options={options}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function SelectionDetailView({
  selection,
  textLine,
  annotations,
  translationLanguageId,
  options,
  depth = 0,
}: SelectionDetailViewProps) {
  const showCoreKindLabels = options?.showCoreKindLabels ?? true;
  const selectionTypeLabel = semanticTypeLabel(selection.selectionType, options);
  const showIds = options?.showIds ?? true;
  const maxDepth = options?.selection?.maxDepth ?? options?.maxDepth ?? 99;
  const canRenderNestedSelections = depth < maxDepth;
  void canRenderNestedSelections;

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
        {showCoreKindLabels && (
          <span className="rounded bg-violet-100 px-2 py-0.5 text-xs font-semibold text-violet-950">
            selection
          </span>
        )}
        {(selection.label || selectionTypeLabel) && (
          <span className="font-semibold text-gray-950">{selection.label ?? selectionTypeLabel}</span>
        )}
        {showIds && <span className="text-xs text-gray-700">{selection.id}</span>}
      </div>

      <div className="mb-2 flex flex-wrap gap-1">
        {selectorTexts.map(({ selectorId, text }) =>
          text || showIds ? (
            <span key={selectorId} className="rounded bg-white px-2 py-0.5 text-xs text-gray-800">
              {text ?? selectorId}
            </span>
          ) : null
        )}
      </div>

      {selection.selectionMappings?.length ? (
        <div className="mb-2 space-y-2">
          {showCoreKindLabels && (
            <div className="text-xs font-semibold uppercase text-gray-700">Whole-selection mappings</div>
          )}
          {selection.selectionMappings.map((mapping) => (
            <MappingDetailView key={mapping.id} mapping={mapping} options={options} />
          ))}
        </div>
      ) : null}

      {selection.selectionRefs?.length ? (
        <div className="mb-2 space-y-1">
          {showCoreKindLabels && (
            <div className="text-xs font-semibold uppercase text-gray-700">Whole-selection refs</div>
          )}
          {selection.selectionRefs.map((refValue) => (
            <RefDetailView
              key={refValue.id}
              refValue={refValue}
              translationLanguageId={translationLanguageId}
              options={options}
            />
          ))}
        </div>
      ) : null}

      {localRefCount ? (
        <div className="space-y-1">
          {showCoreKindLabels && (
            <div className="text-xs font-semibold uppercase text-gray-700">Selection-local selected text refs</div>
          )}
          {selection.localSelectedTextRefs?.map((bundle) => (
            <div key={bundle.id} className="rounded bg-white/80 p-2">
              {showIds && (
                <div className="mb-1 text-xs font-semibold text-gray-700">{bundle.source}</div>
              )}
              <div className="space-y-1">
                {bundle.attachments.map((attachment) => (
                  <RefDetailView
                    key={attachment.id}
                    refValue={attachment.ref}
                    translationLanguageId={translationLanguageId}
                    options={options}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {selectionAnnotations.length ? (
        <div className="mt-2 space-y-2">
          {showCoreKindLabels && (
            <div className="text-xs font-semibold uppercase text-gray-700">Selection-local selected text mappings</div>
          )}
          {selectionAnnotations.map((annotation) => (
            <SelectedTextAnnotationView
              key={annotation.selectorId}
              annotation={annotation}
              translationLanguageId={translationLanguageId}
              options={options}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
