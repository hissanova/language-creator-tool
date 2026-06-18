import type { CSSProperties } from "react";
import type {
  DictionaryBody,
  Resource,
  SelectorNode,
  Speaker,
  TextNode,
  TextNodeRef,
  TimeSpan,
  Transform,
} from "../types/lcm";
import type { ViewerStyle } from "../types/viewerStyle";
import { HoverWord } from "./HoverWord";

type SpeakerRef = TextNodeRef & {
  body: { type: "speaker"; speakerId: string };
};

type AlignmentRef = TextNodeRef & {
  body: { type: "alignment"; interval: TimeSpan };
};

type ResourceListRef = TextNodeRef & {
  body: { type: "resourceRef"; refs: { resourceId: string }[] };
};

type TagTextNodeRef = TextNodeRef & {
  body: { type: "tag"; tags: string[] };
};

type TagSelectorRef = NonNullable<SelectorNode["refs"]>[number] & {
  body: { type: "tag"; tags: string[] };
};

type Props = {
  textNode: TextNode;
  speakers: Speaker[];
  resources?: Resource[];
  formId: string;
  translationLanguageId: string;
  style: ViewerStyle;
  annotationMode?: "learner" | "developer";
  canPlay?: boolean;
  onPlay?: (interval: TimeSpan) => void;
};

function getSpeakerRef(refs: TextNodeRef[] | undefined) {
  return refs?.find((ref): ref is SpeakerRef => ref.body.type === "speaker");
}

function getAlignmentRef(refs: TextNodeRef[] | undefined) {
  return refs?.find((ref): ref is AlignmentRef => ref.body.type === "alignment");
}

function isResourceListRef(ref: TextNodeRef): ref is ResourceListRef {
  return ref.body.type === "resourceRef";
}

function isTagTextNodeRef(ref: TextNodeRef): ref is TagTextNodeRef {
  return ref.body.type === "tag";
}

function isTagSelectorRef(ref: NonNullable<SelectorNode["refs"]>[number]): ref is TagSelectorRef {
  return ref.body.type === "tag";
}

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

function collectTextNodeTags(textNode: TextNode) {
  return textNode.refs?.filter(isTagTextNodeRef).flatMap((refValue) => refValue.body.tags) ?? [];
}

function getText(value: { text: string } | string | undefined): string | undefined {
  if (value == null) return undefined;
  return typeof value === "string" ? value : value.text;
}

function formatFormedTextList(values: { text: string }[] | string[] | string | undefined) {
  if (values == null) return undefined;
  if (typeof values === "string") return values;
  return values.map((value) => getText(value)).filter(Boolean).join(", ");
}

function getDisplayTransform(textNode: TextNode, formId: string): Transform | undefined {
  if (!formId || formId === "none" || formId === textNode.content.formId) return undefined;

  return textNode.transforms?.find(
    (transform) =>
      (transform.transformType === "form" ||
        transform.transformType === "transliteration" ||
        transform.transformType === "romanization" ||
        transform.transformType === "phonemization" ||
        transform.transformType === "representation") &&
      transform.output.content.formId === formId
  );
}

function getTranslation(textNode: TextNode, languageId: string): string | undefined {
  if (!languageId || languageId === "none") return undefined;

  return textNode.transforms?.find(
    (transform) =>
      transform.transformType === "translation" &&
      transform.output.content.languageId === languageId
  )?.output.content.text;
}

function getSelectorForm(selector: SelectorNode, formId: string): string | undefined {
  if (!formId || formId === "none") return undefined;

  return selector.children
    .flatMap((child) => child.transforms ?? [])
    .find(
      (transform) =>
        transform.transformType === "form" && transform.output.content.formId === formId
    )?.output.content.text;
}

function dictionaryText(body: DictionaryBody, translationLanguageId: string) {
  const definition =
    translationLanguageId === "none"
      ? undefined
      : formatFormedTextList(body.definitions?.[translationLanguageId]);

  const parts = [
    body.ref ? `ref: ${body.ref.resourceId}` : undefined,
    getText(body.headword) ? `headword: ${getText(body.headword)}` : undefined,
    getText(body.lemma) ? `lemma: ${getText(body.lemma)}` : undefined,
    body.pos ? `pos: ${body.pos}` : undefined,
    definition ? `definition: ${definition}` : undefined,
    body.tags?.length ? `tags: ${body.tags.join(", ")}` : undefined,
  ];

  return parts.filter(Boolean).join(" | ");
}

function refText(ref: TextNodeRef | NonNullable<SelectorNode["refs"]>[number], translationLanguageId: string) {
  switch (ref.body.type) {
    case "dictionary":
      return dictionaryText(ref.body, translationLanguageId);
    case "note":
      return ref.body.text;
    case "tag":
      return ref.body.tags.join(", ");
    case "resourceRef":
      return ref.body.refs.map((resourceRef) => resourceRef.resourceId).join(", ");
    case "custom":
      return ref.body.schema ?? "Custom";
    case "relation":
      return ref.body.label ?? ref.body.relationType;
    case "alignment":
    case "speaker":
      return undefined;
  }
}

function selectorTitle(selector: SelectorNode, translationLanguageId: string) {
  return selector.refs
    ?.map((ref) => refText(ref, translationLanguageId))
    .filter(Boolean)
    .join("\n");
}

function isValidRange(range: { start: number; end: number } | undefined, text: string) {
  return Boolean(
    range &&
      range.start >= 0 &&
      range.end > range.start &&
      range.end <= text.length
  );
}

function getSelectorRanges(selector: SelectorNode) {
  return selector.children.flatMap((child) =>
    child.source?.type === "selector" ? child.source.ranges : []
  );
}

function renderAnnotatedText({
  text,
  selectors,
  formId,
  translationLanguageId,
  style,
}: {
  text: string;
  selectors: SelectorNode[];
  formId: string;
  translationLanguageId: string;
  style: ViewerStyle;
}) {
  const selected = selectors
    .flatMap((selector) =>
      getSelectorRanges(selector).map((range) => ({ selector, range }))
    )
    .filter(({ range }) => isValidRange(range, text))
    .sort((a, b) => a.range.start - b.range.start || b.range.end - a.range.end);

  const nodes: React.ReactNode[] = [];
  let cursor = 0;

  for (const { selector, range } of selected) {
    if (range.start < cursor) continue;

    if (cursor < range.start) {
      nodes.push(<span key={`plain-${cursor}`}>{text.slice(cursor, range.start)}</span>);
    }

    const selectedText = text.slice(range.start, range.end);
    const form = getSelectorForm(selector, formId);
    const title = selectorTitle(selector, translationLanguageId);
    const hasTitle = Boolean(title);

    const hoverText = form ? (
      <ruby>
        {selectedText}
        <rt className="text-xs text-gray-500">{form}</rt>
      </ruby>
    ) : (
      selectedText
    );

    nodes.push(
      <HoverWord
        key={`${selector.id}-${range.start}-${range.end}`}
        text={hoverText}
        title={title}
        className={hasTitle ? style.text.annotated : style.text.annotationWithoutPopup}
      />
    );

    cursor = range.end;
  }

  if (cursor < text.length) {
    nodes.push(<span key={`plain-${cursor}`}>{text.slice(cursor)}</span>);
  }

  return nodes;
}

function RefView({
  refValue,
  translationLanguageId,
  style,
}: {
  refValue: TextNodeRef | NonNullable<SelectorNode["refs"]>[number];
  translationLanguageId: string;
  style: ViewerStyle;
}) {
  const text = refText(refValue, translationLanguageId);
  if (!text) return null;

  return (
    <div className={style.text.annotationBox}>
      <div className={style.text.annotationTitle}>{refValue.body.type}</div>
      <div>{text}</div>
    </div>
  );
}

function formatRanges(ranges: ReturnType<typeof getSelectorRanges>) {
  if (!ranges?.length) return "no ranges";
  return ranges.map((range) => `${range.start}-${range.end}`).join(", ");
}

function formatSource(source: TextNode["source"]) {
  if (!source) return undefined;

  switch (source.type) {
    case "selector":
      return `selector ranges ${formatRanges(source.ranges)}`;
    case "external":
      return source.label ? `external: ${source.label}` : "external";
  }
}

function RefDetailView({
  refValue,
  translationLanguageId,
}: {
  refValue: TextNodeRef | NonNullable<SelectorNode["refs"]>[number];
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

function TransformDetailView({
  transformValue,
  translationLanguageId,
  style,
  depth,
}: {
  transformValue: Transform;
  translationLanguageId: string;
  style: ViewerStyle;
  depth: number;
}) {
  return (
    <div className="rounded border border-emerald-200 bg-emerald-50/60 p-2 text-gray-950">
      <div className="mb-1 flex flex-wrap items-center gap-2">
        <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-900">
          transform
        </span>
        <span className="font-semibold text-gray-900">{transformValue.transformType}</span>
        <span className="text-xs text-gray-700">{transformValue.id}</span>
      </div>
      <TextNodeDetailView
        textNode={transformValue.output}
        translationLanguageId={translationLanguageId}
        style={style}
        depth={depth + 1}
        label="output"
      />
    </div>
  );
}

function TextNodeDetailView({
  textNode,
  translationLanguageId,
  style,
  depth,
  label = "text node",
}: {
  textNode: TextNode;
  translationLanguageId: string;
  style: ViewerStyle;
  depth: number;
  label?: string;
}) {
  const source = formatSource(textNode.source);

  return (
    <div
      className="rounded border border-gray-200 bg-white/95 p-2 text-gray-950"
      style={{ marginLeft: depth ? `${Math.min(depth, 4) * 0.75}rem` : undefined }}
    >
      <div className="mb-1 flex flex-wrap items-center gap-2">
        <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-900">
          {label}
        </span>
        <span className="text-xs text-gray-700">{textNode.id}</span>
      </div>
      <div className="rounded bg-gray-50 px-2 py-1 font-medium text-gray-950">
        {textNode.content.text}
      </div>
      <div className="mt-1 flex flex-wrap gap-2 text-xs text-gray-800">
        <span>language: {textNode.content.languageId}</span>
        <span>form: {textNode.content.formId}</span>
        {source && <span>source: {source}</span>}
      </div>

      {textNode.refs?.length ? (
        <div className="mt-2 space-y-1">
          {textNode.refs.map((refValue) => (
            <RefDetailView
              key={refValue.id}
              refValue={refValue}
              translationLanguageId={translationLanguageId}
            />
          ))}
        </div>
      ) : null}

      {textNode.transforms?.length ? (
        <div className="mt-2 space-y-2">
          {textNode.transforms.map((transformValue) => (
            <TransformDetailView
              key={transformValue.id}
              transformValue={transformValue}
              translationLanguageId={translationLanguageId}
              style={style}
              depth={depth + 1}
            />
          ))}
        </div>
      ) : null}

      {textNode.selectors?.length ? (
        <div className="mt-2 space-y-2">
          {textNode.selectors.map((selector) => (
            <SelectorView
              key={selector.id}
              selector={selector}
              translationLanguageId={translationLanguageId}
              style={style}
              depth={depth + 1}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function SelectorView({
  selector,
  translationLanguageId,
  style,
  depth = 0,
}: {
  selector: SelectorNode;
  translationLanguageId: string;
  style: ViewerStyle;
  depth?: number;
}) {
  if (!selector.refs?.length && !selector.children.length) return null;

  return (
    <div
      className="rounded border border-sky-200 bg-sky-50/70 p-3 text-gray-950"
      style={{ marginLeft: depth ? `${Math.min(depth, 4) * 0.75}rem` : undefined }}
    >
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className="rounded bg-sky-100 px-2 py-0.5 text-xs font-semibold text-sky-950">
          selector
        </span>
        <span className="font-semibold text-gray-950">
          {selector.label ?? selector.selectorType}
        </span>
        <span className="text-xs text-gray-700">{selector.selectorType}</span>
        <span className="text-xs text-gray-700">ranges: {formatRanges(getSelectorRanges(selector))}</span>
      </div>

      {selector.refs?.length ? (
        <div className="mb-2 space-y-1">
          {selector.refs.map((refValue) => (
            <RefDetailView
              key={refValue.id}
              refValue={refValue}
              translationLanguageId={translationLanguageId}
            />
          ))}
        </div>
      ) : null}

      {selector.children.length ? (
        <div className="space-y-2">
          {selector.children.map((child) => (
            <TextNodeDetailView
              key={child.id}
              textNode={child}
              translationLanguageId={translationLanguageId}
              style={style}
              depth={depth + 1}
              label="child text"
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function transformLabel(transformValue: Transform) {
  if (transformValue.transformType === "translation") {
    return transformValue.output.content.languageId;
  }

  return transformValue.transformType;
}

function LearnerSelectorView({
  selector,
  style,
}: {
  selector: SelectorNode;
  style: ViewerStyle;
}) {
  const tags =
    selector.refs
      ?.filter(isTagSelectorRef)
      .flatMap((refValue) => refValue.body.tags) ?? [];
  const childTransforms = selector.children.flatMap((child) => child.transforms ?? []);

  if (!tags.length && !childTransforms.length && !selector.children.length) return null;

  return (
    <div className="rounded border border-gray-200 bg-white p-3 text-gray-950 shadow-sm">
      <div className="mb-2 font-semibold text-gray-950">
        {selector.label ?? selector.children[0]?.content.text ?? selector.selectorType}
      </div>

      {tags.length ? (
        <div className="mb-2 flex flex-wrap gap-1">
          {tags.map((tag) => (
            <TagChip key={tag} tag={tag} style={style} />
          ))}
        </div>
      ) : null}

      {childTransforms.length ? (
        <div className="space-y-1">
          {childTransforms.map((transformValue) => (
            <div
              key={transformValue.id}
              className="grid gap-1 rounded bg-gray-50 px-2 py-1 sm:grid-cols-[minmax(4rem,auto)_1fr]"
            >
              <span className="text-xs font-semibold uppercase text-gray-700">
                {transformLabel(transformValue)}
              </span>
              <span>{transformValue.output.content.text}</span>
            </div>
          ))}
        </div>
      ) : null}

      {selector.children.some((child) => child.selectors?.length) ? (
        <div className="mt-2 space-y-2 border-l border-gray-200 pl-3">
          {selector.children.flatMap((child) =>
            (child.selectors ?? []).map((childSelector) => (
              <LearnerSelectorView key={childSelector.id} selector={childSelector} style={style} />
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}

function ResourceView({
  resource,
  translationLanguageId,
  style,
}: {
  resource: Resource;
  translationLanguageId: string;
  style: ViewerStyle;
}) {
  if (resource.type === "image") {
    const caption =
      translationLanguageId === "none"
        ? undefined
        : resource.caption?.[translationLanguageId]?.text;

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

export function ScriptLine({
  textNode,
  speakers,
  resources = [],
  formId,
  translationLanguageId,
  style,
  annotationMode = "learner",
  canPlay = false,
  onPlay,
}: Props) {
  const speakerId = getSpeakerRef(textNode.refs)?.body.speakerId;
  const speaker = speakers.find((s) => s.id === speakerId);
  const speakerStyle = style.speaker.default;
  const speakerDisplayStyle = speakerId ? style.speakers?.[speakerId] : undefined;
  const speakerNameStyle: CSSProperties | undefined = speakerDisplayStyle
    ? {
        ...speakerDisplayStyle.style,
        color: speakerDisplayStyle.nameColor ?? speakerDisplayStyle.style?.color,
      }
    : undefined;
  const displayText = getDisplayTransform(textNode, formId)?.output ?? textNode;
  const text = displayText.content.text;
  const translation = getTranslation(textNode, translationLanguageId);
  const alignment = getAlignmentRef(textNode.refs)?.body.interval;
  const textNodeTags = collectTextNodeTags(textNode);
  const resourceRefs =
    textNode.refs
      ?.filter(isResourceListRef)
      .flatMap((ref) => ref.body.refs) ?? [];
  const nodeResources = resourceRefs
    .map((resourceRef) => resources.find((resource) => resource.id === resourceRef.resourceId))
    .filter((resource): resource is Resource => Boolean(resource));

  return (
    <div className={speakerStyle.container}>
      <p className={style.text.line}>
        {canPlay && alignment && (
          <button
            onClick={() => onPlay?.(alignment)}
            className={`${style.layout.playButton} mr-2 align-middle`}
            aria-label="Play line"
            title="Play line"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              width="16"
              height="16"
              fill="currentColor"
              aria-hidden
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          </button>
        )}
        {speaker && (
          <span
            className={[speakerStyle.name, speakerDisplayStyle?.className]
              .filter(Boolean)
              .join(" ")}
            style={speakerNameStyle}
          >
            {speaker.name}:{" "}
          </span>
        )}
        {renderAnnotatedText({
          text,
          selectors: displayText.selectors ?? [],
          formId,
          translationLanguageId,
          style,
        })}
      </p>

      {translation && <p className={style.text.translation}>{translation}</p>}

      {textNodeTags.length ? (
        <div className="mt-2 flex flex-wrap gap-1">
          {textNodeTags.map((tag) => (
            <TagChip key={tag} tag={tag} style={style} />
          ))}
        </div>
      ) : null}

      {textNode.refs?.map((refValue) => (
        refValue.body.type === "tag" ? null : (
          <RefView
            key={refValue.id}
            refValue={refValue}
            translationLanguageId={translationLanguageId}
            style={style}
          />
        )
      ))}

      {displayText.selectors?.length ? (
        <details className="mt-3 text-sm">
          <summary className="cursor-pointer text-gray-800">Annotations</summary>
          <div className="mt-2 space-y-2">
            {displayText.selectors.map((selector) => (
              annotationMode === "developer" ? (
                <SelectorView
                  key={selector.id}
                  selector={selector}
                  translationLanguageId={translationLanguageId}
                  style={style}
                />
              ) : (
                <LearnerSelectorView key={selector.id} selector={selector} style={style} />
              )
            ))}
          </div>
        </details>
      ) : null}

      {nodeResources.map((resource) => (
        <ResourceView
          key={resource.id}
          resource={resource}
          translationLanguageId={translationLanguageId}
          style={style}
        />
      ))}
    </div>
  );
}
