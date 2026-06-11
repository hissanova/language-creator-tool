import type {
  Annotation,
  OptionId,
  ScriptLine as ScriptLineType,
  Speaker,
  TextAnnotation,
} from "../types/viewer";

type Props = {
  line: ScriptLineType;
  speakers: Speaker[];
  textVariantId: OptionId;
  rubyTypeId: OptionId;
  translationLanguageId: OptionId;
};

const speakerColorClasses: Record<Speaker["color"], string> = {
  blue: "border-blue-300 bg-blue-50",
  green: "border-green-300 bg-green-50",
  purple: "border-purple-300 bg-purple-50",
  orange: "border-orange-300 bg-orange-50",
};

const speakerNameClasses: Record<Speaker["color"], string> = {
  blue: "text-blue-700",
  green: "text-green-700",
  purple: "text-purple-700",
  orange: "text-orange-700",
};

function isTextAnnotation(annotation: Annotation): annotation is TextAnnotation {
  return (
    annotation.type === "word" ||
    annotation.type === "phrase" ||
    annotation.type === "note"
  );
}

function renderAnnotatedText({
  text,
  annotations,
  rubyTypeId,
  translationLanguageId,
}: {
  text: string;
  annotations: Annotation[];
  rubyTypeId: OptionId;
  translationLanguageId: OptionId;
}) {
  const textAnnotations = annotations
    .filter(isTextAnnotation)
    .filter((a) => a.start >= 0 && a.end > a.start && a.end <= text.length)
    .sort((a, b) => a.start - b.start || b.end - a.end);

  const nodes: React.ReactNode[] = [];
  let cursor = 0;

  for (const annotation of textAnnotations) {
    if (annotation.start < cursor) continue;

    if (cursor < annotation.start) {
      nodes.push(
        <span key={`plain-${cursor}`}>
          {text.slice(cursor, annotation.start)}
        </span>
      );
    }

    const annotatedText = text.slice(annotation.start, annotation.end);

    const ruby =
      rubyTypeId === "none" ? undefined : annotation.ruby?.[rubyTypeId];

    const meaning =
      translationLanguageId === "none"
        ? undefined
        : annotation.meanings?.[translationLanguageId];

    const title = meaning ?? annotation.note;
    const hasTitle = Boolean(title);

    nodes.push(
      <span
        key={annotation.id}
        className={
          hasTitle
            ? "cursor-help px-0.5 underline decoration-dotted"
            : "px-0.5"
        }
        title={title}
      >
        {ruby ? (
          <ruby>
            {annotatedText}
            <rt className="text-xs">{ruby}</rt>
          </ruby>
        ) : (
          annotatedText
        )}
      </span>
    );

    cursor = annotation.end;
  }

  if (cursor < text.length) {
    nodes.push(<span key={`plain-${cursor}`}>{text.slice(cursor)}</span>);
  }

  return nodes;
}

export function ScriptLine({
  line,
  speakers,
  textVariantId,
  rubyTypeId,
  translationLanguageId,
}: Props) {
  const speaker = speakers.find((s) => s.id === line.speakerId);
  if (!speaker) return null;

  const text =
    line.texts[textVariantId] ?? Object.values(line.texts)[0] ?? "";

  const annotations = line.annotations ?? [];

  const translation =
    translationLanguageId === "none"
      ? undefined
      : line.translations?.[translationLanguageId];

  const imageAnnotations = annotations.filter(
    (annotation) => annotation.type === "image"
  );

  return (
    <div
      className={`rounded-xl border p-4 ${speakerColorClasses[speaker.color]}`}
    >
      <p className={`mb-2 font-bold ${speakerNameClasses[speaker.color]}`}>
        {speaker.name}
      </p>

      {/* <p className="text-xl leading-10"> */}
      <p className="text-xl leading-10 text-gray-900">
        {renderAnnotatedText({
          text,
          annotations,
          rubyTypeId,
          translationLanguageId,
        })}
      </p>

      {translation && (
        <p className="mt-3 text-sm text-gray-600">{translation}</p>
      )}

      {imageAnnotations.length > 0 && (
        <div className="mt-4 grid gap-3">
          {imageAnnotations.map((annotation) => {
            const caption =
              translationLanguageId === "none"
                ? undefined
                : annotation.caption?.[translationLanguageId];

            return (
              <figure
                key={annotation.id}
                className="rounded-lg border bg-white p-3"
              >
                <img
                  src={annotation.src}
                  alt={annotation.alt ?? ""}
                  className="max-h-64 rounded object-contain"
                />
                {caption && (
                  <figcaption className="mt-2 text-sm text-gray-600">
                    {caption}
                  </figcaption>
                )}
              </figure>
            );
          })}
        </div>
      )}
    </div>
  );
}