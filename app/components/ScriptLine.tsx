import type {
  Annotation,
  DictionaryAnnotation,
  FormAnnotation,
  FormedText,
  Line,
  Resource,
  Speaker,
  Target,
} from "../types/lcm";
import type { ViewerStyle } from "../types/viewerStyle";
import { HoverWord } from "./HoverWord";

type Props = {
  line: Line;
  speakers: Speaker[];
  textVariantId: string;
  formTypeId: string;
  translationLanguageId: string;
  style: ViewerStyle;
};

function getLineTarget(line: Line): Target | undefined {
  return line.targets?.find((target) => target.kind === "line");
}

function getLineFormText(line: Line, textVariantId: string): string {
  if (!textVariantId || textVariantId === "none") return line.text.text;

  const lineTarget = getLineTarget(line);
  const form = lineTarget?.annotations?.find(
    (annotation): annotation is FormAnnotation =>
      annotation.type === "form" && annotation.formType === textVariantId
  );

  return form?.value.text ?? line.text.text;
}

function getLineTranslation(line: Line, languageId: string): string | undefined {
  if (!languageId || languageId === "none") return undefined;

  const lineTarget = getLineTarget(line);
  const translation = lineTarget?.annotations?.find(
    (annotation) =>
      annotation.type === "translation" && annotation.language === languageId
  );

  return translation?.type === "translation" ? translation.text : undefined;
}

function getMeaning(annotation: DictionaryAnnotation, languageId: string) {
  if (!languageId || languageId === "none") return undefined;
  return annotation.meanings?.[languageId];
}

function getForm(annotation: Annotation, formTypeId: string): string | undefined {
  if (!formTypeId || formTypeId === "none") return undefined;
  if (annotation.type !== "form") return undefined;
  if (annotation.formType !== formTypeId) return undefined;
  return annotation.value.text;
}

function getTargetPopupTitle(target: Target, translationLanguageId: string) {
  const dictionary = target.annotations?.find(
    (annotation): annotation is DictionaryAnnotation =>
      annotation.type === "dictionary"
  );

  const meaning = dictionary ? getMeaning(dictionary, translationLanguageId) : undefined;

  const note = target.annotations?.find((annotation) => annotation.type === "note");
  const correction = target.annotations?.find(
    (annotation) => annotation.type === "correction"
  );

  return [
    meaning,
    note?.type === "note" ? note.text : undefined,
    correction?.type === "correction"
      ? `Correction: ${correction.value.text}`
      : undefined,
  ]
    .filter(Boolean)
    .join("\n");
}

function getTargetForm(target: Target, formTypeId: string) {
  const form = target.annotations
    ?.map((annotation) => getForm(annotation, formTypeId))
    .find(Boolean);

  return form;
}

function isValidTextSpanTarget(target: Target, text: string) {
  return Boolean(
    target.kind === "textSpan" &&
    target.range &&
    target.range.start >= 0 &&
    target.range.end > target.range.start &&
    target.range.end <= text.length
  );
}

function renderAnnotatedText({
  text,
  targets,
  formTypeId,
  translationLanguageId,
  style,
}: {
  text: string;
  targets: Target[];
  formTypeId: string;
  translationLanguageId: string;
  style: ViewerStyle;
}) {
  const textTargets = targets
    .filter((target): target is Extract<Target, { kind: "textSpan" }> =>
      isValidTextSpanTarget(target, text)
    )
    .sort((a, b) => a.range!.start - b.range!.start || b.range!.end - a.range!.end);

  const nodes: React.ReactNode[] = [];
  let cursor = 0;

  for (const target of textTargets) {
    const range = target.range;
    if (!range || range.start < cursor) continue;

    if (cursor < range.start) {
      nodes.push(<span key={`plain-${cursor}`}>{text.slice(cursor, range.start)}</span>);
    }

    const annotatedText = text.slice(range.start, range.end);
    const form = getTargetForm(target, formTypeId);
    const title = getTargetPopupTitle(target, translationLanguageId);
    const hasTitle = Boolean(title);

    const hoverText = form ? (
      <ruby>
      {annotatedText}
      <rt className="ml-1 text-xs text-gray-500">{form}</rt>
      </ruby>
    ) : (
      annotatedText
    );

    nodes.push(
      <HoverWord
      key={target.id}
      // HoverWord.text may be typed as string; cast to any to allow JSX ruby
      text={hoverText as any}
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
        : resource.caption?.[translationLanguageId];

    return (
      <figure className={style.resource.figure}>
        <img src={resource.src} alt={resource.alt ?? ""} className={style.resource.image} />
        {caption && <figcaption className={style.resource.caption}>{caption}</figcaption>}
      </figure>
    );
  }

  if (resource.type === "audio") {
    return <audio controls src={resource.src} className="mt-3 w-full" />;
  }

  if (resource.type === "video") {
    return <video controls src={resource.src} className="mt-3 max-h-64 w-full" />;
  }

  return (
    <a href={resource.href} target="_blank" rel="noreferrer" className="underline">
      {resource.label ?? resource.href}
    </a>
  );
}

function LineResources({
  line,
  translationLanguageId,
  style,
}: {
  line: Line;
  translationLanguageId: string;
  style: ViewerStyle;
}) {
  const resources = line.targets?.flatMap((target) => target.resources ?? []) ?? [];
  if (resources.length === 0) return null;

  return (
    <div className="mt-4 grid gap-3">
      {resources.map((resource) => (
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

export function ScriptLine({
  line,
  speakers,
  textVariantId,
  formTypeId,
  translationLanguageId,
  style,
}: Props) {
  const speaker = speakers.find((s) => s.id === line.speakerId);
  const speakerStyle =
    (speaker?.color && style.speaker.colors[speaker.color]) ?? style.speaker.default;

  const text = getLineFormText(line, textVariantId);
  const translation = getLineTranslation(line, translationLanguageId);
  const targets = line.targets ?? [];

  return (
    <div className={style.speaker.default.container}>
      {speaker && <p className={style.speaker.colors[speaker.name]?.name || style.speaker.default.name}>{speaker.name}</p>}

      <p className={style.text.line}>
        {renderAnnotatedText({
          text,
          targets,
          formTypeId,
          translationLanguageId,
          style,
        })}
      </p>

      {translation && <p className={style.text.translation}>{translation}</p>}

      <LineResources
        line={line}
        translationLanguageId={translationLanguageId}
        style={style}
      />
    </div>
  );
}
