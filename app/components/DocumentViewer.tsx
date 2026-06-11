import type {
  Annotation,
  Document,
  FormedText,
  FormedTextUnit,
  Line,
  Resource,
  Section,
  Target,
} from "../types/lcm";

type Props = {
  document: Document;
};

export function DocumentViewer({ document }: Props) {
  return (
    <article className="mx-auto max-w-3xl space-y-6 p-6">
      <header className="border-b pb-4">
        <h1 className="text-2xl font-bold">{document.metadata.title}</h1>
        <p className="text-sm text-gray-500">
          {document.metadata.documentType ?? "document"} /{" "}
          {document.metadata.targetLanguage}
        </p>
      </header>

      <div className="space-y-8">
        {document.body.map((section) => (
          <SectionView key={section.id} section={section} />
        ))}
      </div>
    </article>
  );
}

function SectionView({ section }: { section: Section }) {
  const Heading = `h${Math.min(section.level + 1, 6)}` as any;

  return (
    <section className="space-y-4">
      <Heading className="text-xl font-semibold">
        {section.title}
        <span className="ml-2 text-sm font-normal text-gray-500">
          {formatSectionTime(section.time)}
        </span>
      </Heading>

      {section.targets?.map((target) => (
        <TargetView key={target.id} target={target} />
      ))}

      <div className="space-y-4">
        {section.lines.map((line) => (
          <LineView key={line.id} line={line} />
        ))}
      </div>

      {section.sections?.map((child) => (
        <SectionView key={child.id} section={child} />
      ))}
    </section>
  );
}

function LineView({ line }: { line: Line }) {
  return (
    <div className="rounded-lg border p-4">
      {line.time && (
        <div className="mb-1 text-xs text-gray-500">{formatTimeSpan(line.time)}</div>
      )}

      <div className="mb-3">
        {line.speakerId && (
          <span className="mr-2 rounded bg-gray-100 px-2 py-0.5 text-sm">
            {line.speakerId}
          </span>
        )}
        <span className="text-lg">{line.text.text}</span>
      </div>

      <FormedTextView formedText={line.text} />

      {line.targets?.map((target) => (
        <TargetView key={target.id} target={target} />
      ))}
    </div>
  );
}

function FormedTextView({ formedText }: { formedText: FormedText }) {
  if (!formedText.decomposition) return null;

  return (
    <div className="mt-3 rounded bg-gray-50 p-3">
      <div className="mb-2 text-sm font-semibold text-gray-700">Decomposition</div>
      <div className="space-y-2">
        {formedText.decomposition.units.map((unit) => (
          <FormedTextUnitView key={unit.id} unit={unit} />
        ))}
      </div>
    </div>
  );
}

function FormedTextUnitView({ unit }: { unit: FormedTextUnit }) {
  return (
    <div className="rounded border bg-white p-3">
      <div className="font-medium">{unit.text.text}</div>

      {unit.time && (
        <div className="text-xs text-gray-500">{formatTimeSpan(unit.time)}</div>
      )}

      <FormedTextView formedText={unit.text} />

      {unit.targets?.map((target) => (
        <TargetView key={target.id} target={target} />
      ))}
    </div>
  );
}

function TargetView({ target }: { target: Target }) {
  return (
    <div className="mt-3 border-l-4 border-gray-200 pl-3">
      <div className="text-sm font-semibold text-gray-700">
        {/* {targetLabel(target)} */}
        {target.time && (
          <span className="ml-2 font-normal text-gray-500">
            {formatTimeSpan(target.time)}
          </span>
        )}
      </div>

      {target.annotations && target.annotations.length > 0 && (
        <div className="mt-2 space-y-2">
          {target.annotations.map((annotation, index) => (
            <AnnotationView key={index} annotation={annotation} />
          ))}
        </div>
      )}

      {target.resources && target.resources.length > 0 && (
        <div className="mt-2 space-y-2">
          {target.resources.map((resource) => (
            <ResourceView key={resource.id} resource={resource} />
          ))}
        </div>
      )}
    </div>
  );
}

function AnnotationView({ annotation }: { annotation: Annotation }) {
  switch (annotation.type) {
    case "dictionary":
      return (
        <AnnotationBox title="Dictionary">
          {annotation.ref && <div>ref: {annotation.ref}</div>}
          {annotation.headword && <div>headword: {annotation.headword}</div>}
          {annotation.pos && <div>pos: {annotation.pos}</div>}
          {annotation.meanings &&
            Object.entries(annotation.meanings).map(([lang, text]) => (
              <div key={lang}>
                {lang}: {text}
              </div>
            ))}
          {annotation.tags && <div>tags: {annotation.tags.join(", ")}</div>}
        </AnnotationBox>
      );

    case "translation":
      return (
        <AnnotationBox title={`Translation (${annotation.language})`}>
          {annotation.text}
        </AnnotationBox>
      );

    case "form":
      return (
        <AnnotationBox title={`Form (${annotation.formType})`}>
          <div>{annotation.value.text}</div>
          <FormedTextView formedText={annotation.value} />
        </AnnotationBox>
      );

    case "note":
      return <AnnotationBox title="Note">{annotation.text}</AnnotationBox>;

    case "correction":
      return (
        <AnnotationBox title="Correction">
          <div>{annotation.value.text}</div>
          <FormedTextView formedText={annotation.value} />
          {annotation.note && <div className="mt-1 text-gray-600">{annotation.note}</div>}
        </AnnotationBox>
      );

    case "tag":
      return <AnnotationBox title="Tags">{annotation.tags.join(", ")}</AnnotationBox>;

    case "language":
      return <AnnotationBox title="Language">{annotation.language}</AnnotationBox>;

    case "sound":
      return (
        <AnnotationBox title="Sound">
          <div>{annotation.label}</div>
          {annotation.description && (
            <div className="text-gray-600">{annotation.description}</div>
          )}
        </AnnotationBox>
      );

    default:
      return null;
  }
}

function AnnotationBox({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded bg-gray-50 p-2 text-sm">
      <div className="font-semibold text-gray-700">{title}</div>
      <div className="mt-1 text-gray-800">{children}</div>
    </div>
  );
}

function ResourceView({ resource }: { resource: Resource }) {
  switch (resource.type) {
    case "image":
      return (
        <div className="rounded bg-gray-50 p-2 text-sm">
          <div className="font-semibold">Image</div>
          <img src={resource.src} alt={resource.alt ?? ""} className="mt-2 max-w-full rounded" />
        </div>
      );

    case "audio":
      return (
        <div className="rounded bg-gray-50 p-2 text-sm">
          <div className="font-semibold">Audio</div>
          <audio controls src={resource.src} className="mt-2 w-full" />
        </div>
      );

    case "video":
      return (
        <div className="rounded bg-gray-50 p-2 text-sm">
          <div className="font-semibold">Video</div>
          <video controls src={resource.src} className="mt-2 w-full" />
        </div>
      );

    case "url":
      return (
        <div className="rounded bg-gray-50 p-2 text-sm">
          <a href={resource.href} target="_blank" rel="noreferrer" className="underline">
            {resource.label ?? resource.href}
          </a>
        </div>
      );
  }
}

function targetLabel(target: Target): string {
  switch (target.kind) {
    case "section":
      return "@section";
    case "line":
      return "@line";
    case "textSpan":
      return `@"${target.text}"`;
  }
}

function formatSectionTime(time: Section["time"]): string {
  if (time.end == null) return `[${formatSeconds(time.start)}]`;
  return `[${formatSeconds(time.start)} --> ${formatSeconds(time.end)}]`;
}

function formatTimeSpan(time: { start: number; end: number }): string {
  return `[${formatSeconds(time.start)} --> ${formatSeconds(time.end)}]`;
}

function formatSeconds(value: number): string {
  const hours = Math.floor(value / 3600);
  const minutes = Math.floor((value % 3600) / 60);
  const seconds = Math.floor(value % 60);
  const milliseconds = Math.round((value - Math.floor(value)) * 1000);

  return [
    hours.toString().padStart(2, "0"),
    minutes.toString().padStart(2, "0"),
    seconds.toString().padStart(2, "0"),
  ].join(":") + `.${milliseconds.toString().padStart(3, "0")}`;
}