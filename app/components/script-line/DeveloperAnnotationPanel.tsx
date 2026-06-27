import type { CSSProperties, ReactNode } from "react";
import type { Resource } from "../../types/core/document";
import type { TextLine } from "../../types/core/textLine";
import type { ViewerStyle } from "../../types/viewerStyle";
import {
  formatRange,
  isTagRef,
  type SelectorAnnotation,
} from "./coreQueries";
import {
  MappingDetailView,
  RefDetailView,
  SelectedTextAnnotationView,
  SelectionDetailView,
} from "./SelectionDetailView";

type Props = {
  textLine: TextLine;
  annotations: SelectorAnnotation[];
  textNodeTags: string[];
  nodeResources: Resource[];
  translationLanguageId: string;
  style: ViewerStyle;
};

function tagDisplayStyle(tag: string, style: ViewerStyle) {
  return style.tags?.[tag];
}

function tagLabel(tag: string, style: ViewerStyle) {
  return tagDisplayStyle(tag, style)?.label ?? tag;
}

function tagInlineStyle(tag: string, style: ViewerStyle): CSSProperties | undefined {
  const configuredStyle = tagDisplayStyle(tag, style)?.style;
  if (!configuredStyle) return undefined;

  return {
    color: configuredStyle.color,
    backgroundColor: configuredStyle.backgroundColor,
    borderColor: configuredStyle.borderColor,
  };
}

function TagChip({ tag, style }: { tag: string; style: ViewerStyle }) {
  const configuredStyle = tagDisplayStyle(tag, style);
  const className =
    configuredStyle?.className ??
    "border-gray-300 bg-gray-100 text-gray-900";

  return (
    <span
      className={`inline-flex items-center rounded border px-2 py-0.5 text-xs font-medium ${className}`}
      style={tagInlineStyle(tag, style)}
    >
      {tagLabel(tag, style)}
    </span>
  );
}

function AnnotationGroup({
  title,
  count,
  children,
}: {
  title: string;
  count?: number;
  children: ReactNode;
}) {
  return (
    <section className="rounded border border-gray-200 bg-white p-3 text-gray-950 shadow-sm">
      <div className="mb-2 flex flex-wrap items-center gap-2 border-b border-gray-100 pb-2">
        <span className="font-semibold text-gray-950">{title}</span>
        {count != null && (
          <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
            {count}
          </span>
        )}
      </div>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function SelectorRecordView({
  textLine,
  annotations,
}: {
  textLine: TextLine;
  annotations: SelectorAnnotation[];
}) {
  if (!textLine.selectorRecord) return null;

  const selectorIds = Object.keys(textLine.selectorRecord);
  if (!selectorIds.length) return null;

  return (
    <AnnotationGroup title="Selector record" count={selectorIds.length}>
      {selectorIds.map((selectorId) => {
        const selector = textLine.selectorRecord?.[selectorId];
        const annotation = annotations.find((candidate) => candidate.selectorId === selectorId);

        if (!selector) return null;

        return (
          <div key={selectorId} className="rounded bg-sky-50 px-2 py-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-sky-950">{annotation?.selectedText ?? selectorId}</span>
              <span className="text-xs text-gray-700">{selectorId}</span>
              <span className="text-xs text-gray-700">{selector.selectorType}</span>
              <span className="text-xs text-gray-700">range: {formatRange(selector)}</span>
            </div>
          </div>
        );
      })}
    </AnnotationGroup>
  );
}

function ResourceView({
  resource,
  style,
}: {
  resource: Resource;
  style: ViewerStyle;
}) {
  if (resource.type === "image") {
    const caption = Object.values(resource.caption ?? {})[0]?.text;

    return (
      <figure className={style.resource.figure}>
        <img src={resource.src} alt={resource.alt ?? ""} className={style.resource.image} />
        {caption && <figcaption className={style.resource.caption}>{caption}</figcaption>}
      </figure>
    );
  }

  if (resource.type === "media" && resource.mediaType === "audio") {
    return <audio controls src={resource.src} className="mt-3 w-full" />;
  }

  if (resource.type === "media" && resource.mediaType === "video") {
    return <video controls src={resource.src} className="mt-3 max-h-64 w-full" />;
  }

  if (resource.type === "external" && resource.uri) {
    return (
      <a href={resource.uri} target="_blank" rel="noreferrer" className="underline">
        {resource.title ?? resource.uri}
      </a>
    );
  }

  return null;
}

export function DeveloperAnnotationPanel({
  textLine,
  annotations,
  textNodeTags,
  nodeResources,
  translationLanguageId,
  style,
}: Props) {
  const nonTagLineRefs = textLine.textLineRefs?.filter((ref) => !isTagRef(ref)) ?? [];
  const wholeLineMappings = textLine.textLineMappings ?? [];
  const selectorRefCount =
    textLine.selectedTextRefs?.reduce((count, bundle) => count + bundle.attachments.length, 0) ?? 0;
  const selectedSelectorIds = new Set(textLine.selections?.flatMap((selection) => selection.selectorIds) ?? []);
  const textLineAnnotations = annotations.filter(
    (annotation) => !annotation.selection && !selectedSelectorIds.has(annotation.selectorId)
  );
  const hasDetails =
    nonTagLineRefs.length ||
    wholeLineMappings.length ||
    textNodeTags.length ||
    textLine.selectorRecord ||
    textLineAnnotations.length ||
    selectorRefCount ||
    textLine.selections?.length ||
    nodeResources.length;

  if (!hasDetails) return null;

  return (
    <details className="mt-3 text-sm">
      <summary className="cursor-pointer text-gray-800">Annotations</summary>
      <div className="mt-2 space-y-3">
        {wholeLineMappings.length || nonTagLineRefs.length || textNodeTags.length ? (
          <AnnotationGroup
            title="Whole-line"
            count={wholeLineMappings.length + nonTagLineRefs.length + textNodeTags.length}
          >
            {nonTagLineRefs.length ? (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase text-gray-700">
                  <span>Refs</span>
                  <span className="rounded bg-gray-100 px-2 py-0.5 text-[0.65rem] font-medium text-gray-700">
                    {nonTagLineRefs.length}
                  </span>
                </div>
                {nonTagLineRefs.map((refValue) => (
                  <RefDetailView
                    key={refValue.id}
                    refValue={refValue}
                    translationLanguageId={translationLanguageId}
                  />
                ))}
              </div>
            ) : null}

            {wholeLineMappings.length ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase text-gray-700">
                  <span>Text mappings</span>
                  <span className="rounded bg-gray-100 px-2 py-0.5 text-[0.65rem] font-medium text-gray-700">
                    {wholeLineMappings.length}
                  </span>
                </div>
                {wholeLineMappings.map((mapping) => (
                  <MappingDetailView key={mapping.id} mapping={mapping} />
                ))}
              </div>
            ) : null}

            {textNodeTags.length ? (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase text-gray-700">
                  <span>Tags</span>
                  <span className="rounded bg-gray-100 px-2 py-0.5 text-[0.65rem] font-medium text-gray-700">
                    {textNodeTags.length}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {textNodeTags.map((tag) => (
                    <TagChip key={tag} tag={tag} style={style} />
                  ))}
                </div>
              </div>
            ) : null}
          </AnnotationGroup>
        ) : null}

        <SelectorRecordView textLine={textLine} annotations={annotations} />

        {selectorRefCount ? (
          <AnnotationGroup title="Selected text refs" count={selectorRefCount}>
            {textLine.selectedTextRefs?.map((bundle) => (
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
          </AnnotationGroup>
        ) : null}

        {textLine.selections?.length ? (
          <AnnotationGroup title="Selections" count={textLine.selections.length}>
            {textLine.selections.map((selection) => (
              <SelectionDetailView
                key={selection.id}
                variant="developer"
                selection={selection}
                textLine={textLine}
                annotations={annotations}
                translationLanguageId={translationLanguageId}
              />
            ))}
          </AnnotationGroup>
        ) : null}

        {textLineAnnotations.length ? (
          <AnnotationGroup title="Selected text mappings" count={textLineAnnotations.length}>
            {textLineAnnotations.map((annotation) => (
              <SelectedTextAnnotationView
                key={annotation.selectorId}
                annotation={annotation}
                translationLanguageId={translationLanguageId}
              />
            ))}
          </AnnotationGroup>
        ) : null}

        {nodeResources.length ? (
          <AnnotationGroup title="Resolved resources" count={nodeResources.length}>
            {nodeResources.map((resource) => (
              <ResourceView
                key={resource.id}
                resource={resource}
                style={style}
              />
            ))}
          </AnnotationGroup>
        ) : null}
      </div>
    </details>
  );
}
