import type { Resource } from "../../types/core/document";
import type { TextLine, TextMappingPayload } from "../../types/core/textLine";
import type { TextLineRef } from "../../types/core/references";
import type {
  AnnotationPanelBlockConfig,
  AnnotationPanelConfig,
  AnnotationPanelDisplayOptions,
  AnnotationPanelFilter,
  AnnotationPanelGroupBlockConfig,
  AnnotationPanelSourceBlockConfig,
} from "../../types/viewer";
import {
  formatRange,
  getSelectorRange,
  mappingText,
  refText,
  type SelectorAnnotation,
} from "./coreQueries";
import { SelectionDetailView } from "./SelectionDetailView";
import { semanticTypeLabel } from "./semanticTypeLabel";

type AnnotationPanelProps = {
  textLine: TextLine;
  resources?: Resource[];
  annotations?: SelectorAnnotation[];
  translationLanguageId: string;
  config: AnnotationPanelConfig;
};

type BlockContext = Omit<AnnotationPanelProps, "config"> & {
  annotations: SelectorAnnotation[];
  defaultOptions?: AnnotationPanelDisplayOptions;
};

type ResourceEntry = {
  refId: string;
  resourceId: string;
  resource?: Resource;
};

function mergeOptions(
  base?: AnnotationPanelDisplayOptions,
  override?: AnnotationPanelDisplayOptions,
): AnnotationPanelDisplayOptions {
  return {
    ...base,
    ...override,
    selection: {
      ...base?.selection,
      ...override?.selection,
    },
  };
}

function showsEmptyState(options?: AnnotationPanelDisplayOptions) {
  return options?.empty === "showEmptyState";
}

function matchesRefFilter(refValue: TextLineRef, filter?: AnnotationPanelFilter) {
  if (filter?.refTypes && !filter.refTypes.includes(refValue.body.type)) return false;
  if (filter?.excludeRefTypes?.includes(refValue.body.type)) return false;
  return true;
}

function matchesMappingFilter(
  mapping: TextMappingPayload,
  filter: AnnotationPanelFilter | undefined,
  translationLanguageId: string,
) {
  if (filter?.mappingTypes && !filter.mappingTypes.includes(mapping.mappingType)) return false;
  if (filter?.excludeMappingTypes?.includes(mapping.mappingType)) return false;

  const languageId = mapping.image.content.languageId;
  if (filter?.languages === "currentTranslation" && languageId !== translationLanguageId) {
    return false;
  }
  if (Array.isArray(filter?.languages) && !filter.languages.includes(languageId)) return false;

  const formId = mapping.image.content.formId;
  if (Array.isArray(filter?.formIds) && !filter.formIds.includes(formId)) return false;

  return true;
}

function filteredRefs(textLine: TextLine, filter?: AnnotationPanelFilter) {
  return textLine.textLineRefs?.filter((refValue) => matchesRefFilter(refValue, filter)) ?? [];
}

function filteredMappings(
  textLine: TextLine,
  filter: AnnotationPanelFilter | undefined,
  translationLanguageId: string,
) {
  return textLine.textLineMappings?.filter((mapping) =>
    matchesMappingFilter(mapping, filter, translationLanguageId)
  ) ?? [];
}

function filteredSelectedTextRefs(textLine: TextLine, filter?: AnnotationPanelFilter) {
  return textLine.selectedTextRefs
    ?.map((bundle) => ({
      ...bundle,
      attachments: bundle.attachments.filter((attachment) =>
        matchesRefFilter(attachment.ref, filter)
      ),
    }))
    .filter((bundle) => bundle.attachments.length) ?? [];
}

function filteredSelectedTextMappings(
  textLine: TextLine,
  filter: AnnotationPanelFilter | undefined,
  translationLanguageId: string,
) {
  return textLine.selectedTextMappings
    ?.map((bundle) => ({
      ...bundle,
      mappings: bundle.mappings.filter((mapping) =>
        matchesMappingFilter(mapping, filter, translationLanguageId)
      ),
    }))
    .filter((bundle) => bundle.mappings.length) ?? [];
}

function filteredSelections(textLine: TextLine, filter?: AnnotationPanelFilter) {
  return textLine.selections?.filter(
    (selection) =>
      !filter?.selectionTypes || filter.selectionTypes.includes(selection.selectionType)
  ) ?? [];
}

function resourceEntries(textLine: TextLine, resources: Resource[] | undefined): ResourceEntry[] {
  return textLine.textLineRefs
    ?.flatMap((refValue) => {
      if (refValue.body.type !== "resourceRef") return [];

      return refValue.body.refs.map((resourceRef) => ({
        refId: refValue.id,
        resourceId: resourceRef.resourceId,
        resource: resources?.find((candidate) => candidate.id === resourceRef.resourceId),
      }));
    }) ?? [];
}

function sourceContentCount(block: AnnotationPanelSourceBlockConfig, context: BlockContext) {
  const { textLine, resources, translationLanguageId } = context;

  switch (block.source) {
    case "textLine.refs":
      return filteredRefs(textLine, block.filter).length;
    case "textLine.textMappings":
      return filteredMappings(textLine, block.filter, translationLanguageId).length;
    case "textLine.selectorRecord":
      return Object.keys(textLine.selectorRecord ?? {}).length;
    case "textLine.selectedTextRefs":
      return filteredSelectedTextRefs(textLine, block.filter).reduce(
        (count, bundle) => count + bundle.attachments.length,
        0
      );
    case "textLine.selectedTextMappings":
      return filteredSelectedTextMappings(textLine, block.filter, translationLanguageId).reduce(
        (count, bundle) => count + bundle.mappings.length,
        0
      );
    case "textLine.selections":
      return filteredSelections(textLine, block.filter).length;
    case "textLine.resources":
      return resourceEntries(textLine, resources).length;
  }
}

function hasSourceContent(block: AnnotationPanelSourceBlockConfig, context: BlockContext) {
  return sourceContentCount(block, context) > 0;
}

function shouldRenderSource(
  block: AnnotationPanelSourceBlockConfig,
  context: BlockContext,
  baseOptions?: AnnotationPanelDisplayOptions,
) {
  const options = mergeOptions(baseOptions, block.options);
  return hasSourceContent(block, context) || showsEmptyState(options);
}

function shouldRenderBlock(block: AnnotationPanelBlockConfig, context: BlockContext) {
  if (block.kind === "source") {
    return shouldRenderSource(block, context, context.defaultOptions);
  }

  const groupOptions = mergeOptions(context.defaultOptions, block.options);
  return (
    block.children.some((child) => shouldRenderSource(child, context, groupOptions)) ||
    showsEmptyState(groupOptions)
  );
}

function RefValue({
  refValue,
  translationLanguageId,
  options,
}: {
  refValue: TextLineRef;
  translationLanguageId: string;
  options: AnnotationPanelDisplayOptions;
}) {
  const showCoreKindLabels = options.showCoreKindLabels ?? true;
  const typeLabel = semanticTypeLabel(refValue.body.type, options);
  const showIds = options.showIds ?? true;
  const text =
    refText(refValue, translationLanguageId) ??
    (refValue.body.type === "alignment"
      ? `${refValue.body.interval.start}${
          refValue.body.interval.end != null ? `-${refValue.body.interval.end}` : ""
        }`
      : refValue.body.type === "speaker"
        ? refValue.body.speakerId
        : "");

  return (
    <div className="rounded border border-gray-200 bg-white px-2 py-1 text-gray-950">
      <div className="flex flex-wrap items-center gap-2">
        {showCoreKindLabels && (
          <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-800">
            ref
          </span>
        )}
        {typeLabel && (
          <span className="font-semibold text-gray-900">{typeLabel}</span>
        )}
        {showIds && <span className="text-xs text-gray-700">{refValue.id}</span>}
        {text && <span>{text}</span>}
      </div>
    </div>
  );
}

function MappingValue({
  mapping,
  options,
}: {
  mapping: TextMappingPayload;
  options: AnnotationPanelDisplayOptions;
}) {
  const showCoreKindLabels = options.showCoreKindLabels ?? true;
  const typeLabel = semanticTypeLabel(mapping.mappingType, options);
  const showIds = options.showIds ?? true;

  return (
    <div className="rounded border border-emerald-200 bg-emerald-50/60 p-2 text-gray-950">
      <div className="flex flex-wrap items-center gap-2">
        {showCoreKindLabels && (
          <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-900">
            mapping
          </span>
        )}
        {typeLabel && (
          <span className="font-semibold text-gray-900">{typeLabel}</span>
        )}
        {showIds && <span className="text-xs text-gray-700">{mapping.id}</span>}
        <span>{mappingText(mapping)}</span>
      </div>
    </div>
  );
}

function SelectorRecordValue({
  textLine,
  annotations,
  options,
}: {
  textLine: TextLine;
  annotations: SelectorAnnotation[];
  options: AnnotationPanelDisplayOptions;
}) {
  const showCoreKindLabels = options.showCoreKindLabels ?? true;
  const showIds = options.showIds ?? true;
  const showRanges = options.showRanges ?? true;
  const showSelectorType = options.selectorRecord?.showSelectorType ?? true;

  return (
    <div className="space-y-1">
      {Object.entries(textLine.selectorRecord ?? {}).map(([selectorId, selector]) => {
        const annotation = annotations.find((candidate) => candidate.selectorId === selectorId);
        const range = getSelectorRange(selector, textLine.content.text);
        const selectedText =
          annotation?.selectedText ??
          (range
            ? textLine.content.text.slice(range.start, range.end)
            : selector.selectorType === "positions"
              ? selector.positions.map((position) => textLine.content.text[position]).join("")
              : undefined);

        return (
          <div key={selectorId} className="rounded bg-sky-50 px-2 py-1 text-gray-950">
            <div className="flex flex-wrap items-center gap-2">
              {showCoreKindLabels && (
                <span className="rounded bg-sky-100 px-2 py-0.5 text-xs font-semibold text-sky-950">
                  selector
                </span>
              )}
              {selectedText && <span className="font-semibold text-sky-950">{selectedText}</span>}
              {showIds && <span className="text-xs text-gray-700">{selectorId}</span>}
              {showSelectorType && semanticTypeLabel(selector.selectorType, options) && (
                <span className="text-xs text-gray-700">
                  {semanticTypeLabel(selector.selectorType, options)}
                </span>
              )}
              {showRanges && (
                <span className="text-xs text-gray-700">range: {formatRange(selector)}</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function selectedTextForSource(
  textLine: TextLine,
  source: string,
  annotations: SelectorAnnotation[],
) {
  const annotation = annotations.find((candidate) => candidate.selectorId === source);
  if (annotation?.selectedText) return annotation.selectedText;

  const selector = textLine.selectorRecord?.[source];
  if (!selector) return undefined;

  const range = getSelectorRange(selector, textLine.content.text);
  if (!range) return undefined;

  return textLine.content.text.slice(range.start, range.end);
}

function SelectedTextBundleHeader({
  textLine,
  source,
  annotations,
  options,
}: {
  textLine: TextLine;
  source: string;
  annotations: SelectorAnnotation[];
  options: AnnotationPanelDisplayOptions;
}) {
  const selectedText = selectedTextForSource(textLine, source, annotations);
  const showIds = options.showIds ?? true;
  const showRanges = options.showRanges ?? true;
  const selector = textLine.selectorRecord?.[source];

  if (!selectedText && !showIds && !(showRanges && selector)) return null;

  return (
    <div className="mb-1 flex flex-wrap items-center gap-2 text-xs text-gray-700">
      {selectedText && (
        <span className="font-semibold text-gray-950">{selectedText}</span>
      )}
      {showIds && <span>{source}</span>}
      {showRanges && selector && <span>range: {formatRange(selector)}</span>}
    </div>
  );
}

function ResourceValue({
  entry,
  options,
}: {
  entry: ResourceEntry;
  options: AnnotationPanelDisplayOptions;
}) {
  const showCoreKindLabels = options.showCoreKindLabels ?? true;
  const typeLabel = entry.resource
    ? semanticTypeLabel(entry.resource.type, options)
    : undefined;
  const showIds = options.showIds ?? true;
  const label = entry.resource
    ? entry.resource.type === "external"
      ? entry.resource.title ?? entry.resource.uri ?? entry.resource.citation
      : entry.resource.type === "media"
        ? entry.resource.label ?? entry.resource.src
        : entry.resource.alt ?? entry.resource.src
    : undefined;

  return (
    <div className="rounded border border-gray-200 bg-white px-2 py-1 text-gray-950">
      <div className="flex flex-wrap items-center gap-2">
        {showCoreKindLabels && (
          <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-800">
            resource
          </span>
        )}
        {typeLabel && (
          <span className="font-semibold text-gray-900">{typeLabel}</span>
        )}
        {showIds && <span className="text-xs text-gray-700">{entry.refId}</span>}
        <span>{entry.resourceId}</span>
        {label && label !== entry.resourceId && <span>{label}</span>}
      </div>
    </div>
  );
}

function SourceContent({
  block,
  options,
  context,
}: {
  block: AnnotationPanelSourceBlockConfig;
  options: AnnotationPanelDisplayOptions;
  context: BlockContext;
}) {
  const { textLine, resources, annotations, translationLanguageId } = context;

  switch (block.source) {
    case "textLine.refs":
      return filteredRefs(textLine, block.filter).map((refValue) => (
        <RefValue
          key={refValue.id}
          refValue={refValue}
          translationLanguageId={translationLanguageId}
          options={options}
        />
      ));
    case "textLine.textMappings":
      return filteredMappings(textLine, block.filter, translationLanguageId).map((mapping) => (
        <MappingValue key={mapping.id} mapping={mapping} options={options} />
      ));
    case "textLine.selectorRecord":
      return <SelectorRecordValue textLine={textLine} annotations={annotations} options={options} />;
    case "textLine.selectedTextRefs":
      return filteredSelectedTextRefs(textLine, block.filter).map((bundle) => (
        <div key={bundle.id} className="rounded bg-gray-50 p-2">
          <SelectedTextBundleHeader
            textLine={textLine}
            source={bundle.source}
            annotations={annotations}
            options={options}
          />
          <div className="space-y-1">
            {bundle.attachments.map((attachment) => (
              <RefValue
                key={attachment.id}
                refValue={attachment.ref}
                translationLanguageId={translationLanguageId}
                options={options}
              />
            ))}
          </div>
        </div>
      ));
    case "textLine.selectedTextMappings":
      return filteredSelectedTextMappings(textLine, block.filter, translationLanguageId).map(
        (bundle) => (
          <div key={bundle.id} className="rounded bg-gray-50 p-2">
            <SelectedTextBundleHeader
              textLine={textLine}
              source={bundle.source}
              annotations={annotations}
              options={options}
            />
            <div className="space-y-2">
              {bundle.mappings.map((mapping) => (
                <MappingValue key={mapping.id} mapping={mapping} options={options} />
              ))}
            </div>
          </div>
        )
      );
    case "textLine.selections":
      return filteredSelections(textLine, block.filter).map((selection) => (
        <SelectionDetailView
          key={selection.id}
          selection={selection}
          textLine={textLine}
          annotations={annotations}
          translationLanguageId={translationLanguageId}
          options={options}
        />
      ));
    case "textLine.resources":
      return resourceEntries(textLine, resources).map((entry) => (
        <ResourceValue
          key={`${entry.refId}-${entry.resourceId}`}
          entry={entry}
          options={options}
        />
      ));
  }
}

function AnnotationPanelSourceBlock({
  block,
  context,
  baseOptions,
}: {
  block: AnnotationPanelSourceBlockConfig;
  context: BlockContext;
  baseOptions?: AnnotationPanelDisplayOptions;
}) {
  const options = mergeOptions(baseOptions, block.options);
  const count = sourceContentCount(block, context);
  const hasContent = count > 0;

  if (!hasContent && !showsEmptyState(options)) return null;

  const content = hasContent ? (
    <SourceContent block={block} options={options} context={context} />
  ) : (
    <div className="text-sm text-gray-500">No annotations.</div>
  );

  if (block.showTitle === false) {
    return <div className="space-y-2 text-sm">{content}</div>;
  }

  return (
    <section className="rounded border border-gray-200 bg-white p-3 text-sm shadow-sm">
      {block.title && (
        <div className="mb-2 flex items-center gap-2 border-b border-gray-100 pb-2 font-semibold text-gray-950">
          <span>{block.title}</span>
          {(options.showCounts ?? false) && (
            <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
              {count}
            </span>
          )}
        </div>
      )}
      <div className="space-y-2">
        {content}
      </div>
    </section>
  );
}

function AnnotationPanelGroupBlock({
  block,
  context,
}: {
  block: AnnotationPanelGroupBlockConfig;
  context: BlockContext;
}) {
  const options = mergeOptions(context.defaultOptions, block.options);
  const visibleChildren = block.children.filter((child) =>
    shouldRenderSource(child, context, options)
  );
  const count = visibleChildren.reduce(
    (total, child) => total + sourceContentCount(child, context),
    0
  );

  if (!visibleChildren.length && !showsEmptyState(options)) return null;

  const content = visibleChildren.length ? (
    visibleChildren.map((child) => (
      <AnnotationPanelSourceBlock
        key={child.id}
        block={child}
        context={context}
        baseOptions={options}
      />
    ))
  ) : (
    <div className="text-sm text-gray-500">No annotations.</div>
  );

  if (block.showTitle === false) {
    return <div className="space-y-2 text-sm">{content}</div>;
  }

  return (
    <section className="rounded border border-gray-200 bg-white p-3 text-sm shadow-sm">
      <div className="mb-2 flex items-center gap-2 border-b border-gray-100 pb-2 font-semibold text-gray-950">
        {block.title && <span>{block.title}</span>}
        {(options.showCounts ?? false) && (
          <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
            {count}
          </span>
        )}
      </div>
      <div className="space-y-2">
        {content}
      </div>
    </section>
  );
}

function AnnotationPanelBlock({
  block,
  context,
}: {
  block: AnnotationPanelBlockConfig;
  context: BlockContext;
}) {
  if (block.kind === "group") {
    return <AnnotationPanelGroupBlock block={block} context={context} />;
  }

  return (
    <AnnotationPanelSourceBlock
      block={block}
      context={context}
      baseOptions={context.defaultOptions}
    />
  );
}

export function AnnotationPanel({
  textLine,
  resources,
  annotations = [],
  translationLanguageId,
  config,
}: AnnotationPanelProps) {
  const context: BlockContext = {
    textLine,
    resources,
    annotations,
    translationLanguageId,
    defaultOptions: config.defaultOptions,
  };
  const visibleBlocks = config.blocks.filter((block) => shouldRenderBlock(block, context));

  if (!visibleBlocks.length && config.empty !== "showEmptyState") return null;

  return (
    <div className="space-y-3">
      {visibleBlocks.length ? (
        visibleBlocks.map((block) => (
          <AnnotationPanelBlock key={block.id} block={block} context={context} />
        ))
      ) : (
        <div className="rounded border border-gray-200 bg-white p-3 text-sm text-gray-500 shadow-sm">
          No annotations.
        </div>
      )}
    </div>
  );
}
