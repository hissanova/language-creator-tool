import type {
  Annotation,
  DictionaryAnnotation,
  FormAnnotation,
  FormedText,
  FormedTextUnit,
  Line,
  Resource,
  Speaker,
  Target,
  TextSpanTarget,
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
  canPlay?: boolean;
  onPlay?: (line: Line) => void;
};

type TextRange = {
  start: number;
  end: number;
};

function getLineTarget(line: Line): Target | undefined {
  return line.targets?.find((target) => target.kind === "line");
}

function getText(value: FormedText | string | undefined): string | undefined {
  if (value == null) return undefined;
  return typeof value === "string" ? value : value.text;
}

function getLineForm(line: Line, textVariantId: string): FormedText {
  if (!textVariantId || textVariantId === "none") return line.text;

  const lineTarget = getLineTarget(line);
  const form = lineTarget?.annotations?.find(
    (annotation): annotation is FormAnnotation =>
      annotation.type === "form" && annotation.formType === textVariantId
  );

  return form?.value ?? line.text;
}

function getLineTranslation(line: Line, languageId: string): string | undefined {
  if (!languageId || languageId === "none") return undefined;

  const lineTarget = getLineTarget(line);
  const translation = lineTarget?.annotations?.find(
    (annotation) =>
      annotation.type === "translation" && annotation.language === languageId
  );

  return translation?.type === "translation"
    ? translation.value?.text ?? translation.text
    : undefined;
}

function formatFormedTextList(values: FormedText[] | string[] | string | undefined) {
  if (values == null) return undefined;
  if (typeof values === "string") return values;
  return values.map((value) => getText(value)).filter(Boolean).join(", ");
}

function getMeaning(annotation: DictionaryAnnotation, languageId: string) {
  if (!languageId || languageId === "none") return undefined;
  return formatFormedTextList(annotation.meanings?.[languageId]);
}

function getForm(annotation: Annotation, formTypeId: string): string | undefined {
  if (!formTypeId || formTypeId === "none") return undefined;
  if (annotation.type !== "form") return undefined;
  if (annotation.formType !== formTypeId) return undefined;
  return annotation.value.text;
}

function annotationText(annotation: Annotation, translationLanguageId: string): string {
  switch (annotation.type) {
    case "dictionary": {
      const parts = [
        annotation.ref ? `ref: ${annotation.ref}` : undefined,
        getText(annotation.headword) ? `headword: ${getText(annotation.headword)}` : undefined,
        getText(annotation.lemma) ? `lemma: ${getText(annotation.lemma)}` : undefined,
        annotation.pos ? `pos: ${annotation.pos}` : undefined,
        getMeaning(annotation, translationLanguageId)
          ? `meaning: ${getMeaning(annotation, translationLanguageId)}`
          : undefined,
        annotation.notes?.length ? `notes: ${annotation.notes.join("; ")}` : undefined,
        annotation.tags?.length ? `tags: ${annotation.tags.join(", ")}` : undefined,
      ];
      return parts.filter(Boolean).join(" | ");
    }
    case "translation":
      return `${annotation.language}: ${annotation.value?.text ?? annotation.text ?? ""}`;
    case "form":
      return `${annotation.formType}: ${annotation.value.text}`;
    case "note":
      return annotation.text;
    case "correction":
      return [annotation.value.text, annotation.note].filter(Boolean).join(" | ");
    case "tag":
      return annotation.tags.join(", ");
    case "language":
      return annotation.language;
    case "sound":
      return [annotation.label, annotation.description].filter(Boolean).join(" | ");
  }
}

function annotationTitle(annotation: Annotation): string {
  switch (annotation.type) {
    case "dictionary":
      return "Dictionary";
    case "translation":
      return `Translation (${annotation.language})`;
    case "form":
      return `Form (${annotation.formType})`;
    case "note":
      return "Note";
    case "correction":
      return "Correction";
    case "tag":
      return "Tags";
    case "language":
      return "Language";
    case "sound":
      return "Sound";
  }
}

function getTargetPopupTitle(target: Target, translationLanguageId: string) {
  return target.annotations
    ?.map((annotation) => annotationText(annotation, translationLanguageId))
    .filter(Boolean)
    .join("\n");
}

function getTargetForm(target: Target, formTypeId: string) {
  return target.annotations
    ?.map((annotation) => getForm(annotation, formTypeId))
    .find(Boolean);
}

function findOccurrenceRange(text: string, needle: string, occurrence = 1): TextRange | undefined {
  if (!needle) return undefined;

  let fromIndex = 0;
  for (let count = 1; count <= occurrence; count += 1) {
    const start = text.indexOf(needle, fromIndex);
    if (start === -1) return undefined;
    if (count === occurrence) return { start, end: start + needle.length };
    fromIndex = start + needle.length;
  }

  return undefined;
}

function getTextSpanRange(target: TextSpanTarget, text: string): TextRange | undefined {
  if (target.range) return target.range;

  if (target.selector?.type === "index") {
    return { start: target.selector.start, end: target.selector.end };
  }

  if (target.selector?.type === "text") {
    return (
      target.selector.range ??
      findOccurrenceRange(text, target.selector.text, target.selector.occurrence)
    );
  }

  if (target.text) return findOccurrenceRange(text, target.text);

  return undefined;
}

function isValidRange(range: TextRange | undefined, text: string) {
  return Boolean(
    range &&
      range.start >= 0 &&
      range.end > range.start &&
      range.end <= text.length
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
    .filter((target): target is TextSpanTarget => target.kind === "textSpan")
    .map((target) => ({ target, range: getTextSpanRange(target, text) }))
    .filter(({ range }) => isValidRange(range, text))
    .sort((a, b) => a.range!.start - b.range!.start || b.range!.end - a.range!.end);

  const nodes: React.ReactNode[] = [];
  let cursor = 0;

  for (const { target, range } of textTargets) {
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
        <rt className="text-xs text-gray-500">{form}</rt>
      </ruby>
    ) : (
      annotatedText
    );

    nodes.push(
      <HoverWord
        key={target.id}
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

function AnnotationView({
  annotation,
  translationLanguageId,
  style,
}: {
  annotation: Annotation;
  translationLanguageId: string;
  style: ViewerStyle;
}) {
  return (
    <div className={style.text.annotationBox}>
      <div className={style.text.annotationTitle}>{annotationTitle(annotation)}</div>
      <div>{annotationText(annotation, translationLanguageId)}</div>
      {annotation.type === "form" && (
        <FormedTextDecomposition
          formedText={annotation.value}
          translationLanguageId={translationLanguageId}
          style={style}
        />
      )}
      {annotation.type === "correction" && (
        <FormedTextDecomposition
          formedText={annotation.value}
          translationLanguageId={translationLanguageId}
          style={style}
        />
      )}
    </div>
  );
}

function TargetView({
  target,
  translationLanguageId,
  style,
}: {
  target: Target;
  translationLanguageId: string;
  style: ViewerStyle;
}) {
  if (!target.annotations?.length && !target.resources?.length) return null;

  return (
    <div className={style.text.targetBlock}>
      <div className={style.text.annotationTitle}>{target.kind}</div>
      {target.annotations?.map((annotation, index) => (
        <AnnotationView
          key={`${target.id}-annotation-${index}`}
          annotation={annotation}
          translationLanguageId={translationLanguageId}
          style={style}
        />
      ))}
      {target.resources?.map((resource) => (
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

function FormedTextDecomposition({
  formedText,
  translationLanguageId,
  style,
}: {
  formedText: FormedText;
  translationLanguageId: string;
  style: ViewerStyle;
}) {
  if (!formedText.decomposition?.units.length) return null;

  return (
    <div className={style.text.form}>
      <div className={style.text.annotationTitle}>Decomposition</div>
      <div className="mt-2 space-y-2">
        {formedText.decomposition.units.map((unit) => (
          <FormedTextUnitView
            key={unit.id}
            unit={unit}
            translationLanguageId={translationLanguageId}
            style={style}
          />
        ))}
      </div>
    </div>
  );
}

function FormedTextUnitView({
  unit,
  translationLanguageId,
  style,
}: {
  unit: FormedTextUnit;
  translationLanguageId: string;
  style: ViewerStyle;
}) {
  return (
    <div className="border-l-2 border-gray-300 pl-3">
      <div className="font-medium text-gray-900">{unit.text.text}</div>
      {unit.targets?.map((target) => (
        <TargetView
          key={target.id}
          target={target}
          translationLanguageId={translationLanguageId}
          style={style}
        />
      ))}
      <FormedTextDecomposition
        formedText={unit.text}
        translationLanguageId={translationLanguageId}
        style={style}
      />
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

export function ScriptLine({
  line,
  speakers,
  textVariantId,
  formTypeId,
  translationLanguageId,
  style,
  canPlay = false,
  onPlay,
}: Props) {
  const speaker = speakers.find((s) => s.id === line.speakerId);
  const speakerStyle =
    (speaker?.color ? style.speaker.colors[speaker.color] : undefined) ??
    style.speaker.default;
  const displayText = getLineForm(line, textVariantId);
  const text = displayText.text;
  const translation = getLineTranslation(line, translationLanguageId);
  const targets = line.targets ?? [];
  const lineTargets = targets.filter((target) => target.kind === "line");
  const inspectableTargets = targets.filter(
    (target) =>
      target.kind !== "line" && (target.annotations?.length || target.resources?.length)
  );

  return (
    <div className={speakerStyle.container}>
      <p className={style.text.line}>
        {canPlay && (
          <button
            onClick={() => onPlay?.(line)}
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
        {speaker && <span className={speakerStyle.name}>{speaker.name}: </span>}
        {renderAnnotatedText({
          text,
          targets,
          formTypeId,
          translationLanguageId,
          style,
        })}
      </p>

      {translation && <p className={style.text.translation}>{translation}</p>}

      <FormedTextDecomposition
        formedText={displayText}
        translationLanguageId={translationLanguageId}
        style={style}
      />

      {lineTargets.length > 0 && (
        <div className="mt-3">
          {lineTargets.map((target) => (
            <TargetView
              key={target.id}
              target={target}
              translationLanguageId={translationLanguageId}
              style={style}
            />
          ))}
        </div>
      )}

      {inspectableTargets.length > 0 && (
        <details className="mt-3 text-sm">
          <summary className="cursor-pointer text-gray-600">Annotations</summary>
          <div className="mt-2 space-y-2">
            {inspectableTargets.map((target) => (
              <TargetView
                key={target.id}
                target={target}
                translationLanguageId={translationLanguageId}
                style={style}
              />
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
