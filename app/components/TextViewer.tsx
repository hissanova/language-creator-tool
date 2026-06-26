import type { FormedText, TimeSpan } from "../types/core/common";
import type {
  Document,
  FigureBlock,
  NoteBlock,
  Resource,
  Section,
  SectionBlock,
  TableBlock,
} from "../types/core/document";
import type { TextLine } from "../types/core/textLine";
import type { TextLineRef } from "../types/core/references";

type SpeakerRef = TextLineRef & {
  body: { type: "speaker"; speakerId: string };
};

type AlignmentRef = TextLineRef & {
  body: { type: "alignment"; interval: TimeSpan };
};

type Props = {
  document: Document;
};

export function TextViewer({ document }: Props) {
  return (
    <article className="mx-auto max-w-3xl space-y-6 p-6">
      <header className="border-b pb-4">
        <h1 className="text-2xl font-bold">{document.metadata.title}</h1>
        <p className="text-sm text-gray-500">
          {document.metadata.documentType ?? "document"} /{" "}
          {document.metadata.defaultLanguageId ?? "unspecified"}
        </p>
      </header>

      <div className="space-y-8">
        {document.sections.map((section) => (
          <SectionView key={section.id} section={section} resources={document.resources ?? []} />
        ))}
      </div>
    </article>
  );
}

function SectionView({ section, resources }: { section: Section; resources: Resource[] }) {
  const headingClassName = "text-xl font-semibold";
  const headingContent = (
    <>
      {section.title}
      {section.time && (
        <span className="ml-2 text-sm font-normal text-gray-500">
          {formatTimeSpan(section.time)}
        </span>
      )}
    </>
  );

  return (
    <section className="space-y-4">
      {(section.level ?? 1) <= 1 ? (
        <h2 className={headingClassName}>{headingContent}</h2>
      ) : section.level === 2 ? (
        <h3 className={headingClassName}>{headingContent}</h3>
      ) : section.level === 3 ? (
        <h4 className={headingClassName}>{headingContent}</h4>
      ) : section.level === 4 ? (
        <h5 className={headingClassName}>{headingContent}</h5>
      ) : (
        <h6 className={headingClassName}>{headingContent}</h6>
      )}

      <div className="space-y-4">
        {section.blocks.map((block) => (
          <SectionBlockView key={getBlockKey(block)} block={block} resources={resources} />
        ))}
      </div>
    </section>
  );
}

function getBlockKey(block: SectionBlock) {
  switch (block.type) {
    case "text":
      return block.text.id;
    case "note":
      return block.note.id;
    case "figure":
      return block.figure.id;
    case "table":
      return block.table.id;
    case "section":
      return block.section.id;
  }
}

function SectionBlockView({ block, resources }: { block: SectionBlock; resources: Resource[] }) {
  switch (block.type) {
    case "text":
      return <TextLineView textLine={block.text} resources={resources} />;
    case "note":
      return <NoteBlockView note={block.note} />;
    case "figure":
      return <FigureBlockView figure={block.figure} resources={resources} />;
    case "table":
      return <TableBlockView table={block.table} />;
    case "section":
      return <SectionView section={block.section} resources={resources} />;
  }
}

function TextLineView({ textLine, resources }: { textLine: TextLine; resources: Resource[] }) {
  const speaker = textLine.textLineRefs?.find(
    (ref): ref is SpeakerRef => ref.body.type === "speaker"
  )?.body.speakerId;
  const alignment = textLine.textLineRefs?.find(
    (ref): ref is AlignmentRef => ref.body.type === "alignment"
  )?.body.interval;

  return (
    <div className="rounded-lg border p-4">
      {alignment && (
        <div className="mb-1 text-xs text-gray-500">{formatTimeSpan(alignment)}</div>
      )}

      <div className="mb-3">
        {speaker && (
          <span className="mr-2 rounded bg-gray-100 px-2 py-0.5 text-sm">
            {speaker}
          </span>
        )}
        <span className="text-lg">{textLine.content.text}</span>
      </div>

      {textLine.textLineMappings?.map((mapping) => (
        <div key={mapping.id} className="mt-2 rounded bg-gray-50 p-2 text-sm">
          <span className="font-semibold">{mapping.mappingType}: </span>
          {mapping.image.content.text}
        </div>
      ))}

      {textLine.textLineRefs?.map((refValue) => (
        <RefView key={refValue.id} body={refValue.body} resources={resources} />
      ))}

      {textLine.selectedTextMappings?.map((bundle) => (
        <AnnotationBox key={bundle.id} title={`Selector ${bundle.source}`}>
          {bundle.mappings.map((mapping) => (
            <div key={mapping.id}>
              {mapping.mappingType}: {mapping.image.content.text}
            </div>
          ))}
        </AnnotationBox>
      ))}
    </div>
  );
}

function RefView({
  body,
  resources,
}: {
  body: TextLineRef["body"];
  resources: Resource[];
}) {
  switch (body.type) {
    case "dictionary":
      return (
        <AnnotationBox title="Dictionary">
          {body.ref && <div>ref: {body.ref.resourceId}</div>}
          {body.headword && <div>headword: {formedTextValue(body.headword)}</div>}
          {body.pos && <div>pos: {body.pos}</div>}
          {body.definitions &&
            Object.entries(body.definitions).map(([lang, text]) => (
              <div key={lang}>
                {lang}: {formedTextListValue(text)}
              </div>
            ))}
          {body.tags && <div>tags: {body.tags.join(", ")}</div>}
        </AnnotationBox>
      );

    case "note":
      return <AnnotationBox title="Note">{body.text}</AnnotationBox>;

    case "tag":
      return <AnnotationBox title="Tags">{body.tags.join(", ")}</AnnotationBox>;

    case "resourceRef":
      return (
        <>
          {body.refs.map((ref) => {
            const resource = resources.find((candidate) => candidate.id === ref.resourceId);
            return resource ? <ResourceView key={ref.resourceId} resource={resource} /> : null;
          })}
        </>
      );

    case "custom":
      return <AnnotationBox title="Custom">{body.schema ?? "custom"}</AnnotationBox>;

    case "alignment":
      return <AnnotationBox title="Alignment">{formatTimeSpan(body.interval)}</AnnotationBox>;

    case "speaker":
      return <AnnotationBox title="Speaker">{body.speakerId}</AnnotationBox>;
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
    <div className="mt-2 rounded bg-gray-50 p-2 text-sm">
      <div className="font-semibold text-gray-700">{title}</div>
      <div className="mt-1 text-gray-800">{children}</div>
    </div>
  );
}

function NoteBlockView({ note }: { note: NoteBlock }) {
  return (
    <aside className="rounded-lg border bg-gray-50 p-4">
      {note.title && <div className="font-semibold">{note.title}</div>}
      {note.body.map((body, index) => (
        <p key={`${note.id}-${index}`}>{body.text}</p>
      ))}
    </aside>
  );
}

function FigureBlockView({
  figure,
  resources,
}: {
  figure: FigureBlock;
  resources: Resource[];
}) {
  const resource = resources.find(
    (candidate): candidate is Extract<Resource, { type: "image" }> =>
      candidate.id === figure.resourceRef.resourceId && candidate.type === "image"
  );
  const caption = firstCaption(figure.caption ?? resource?.caption);

  return (
    <figure className="rounded-lg border bg-gray-50 p-4">
      {resource && <img src={resource.src} alt={resource.alt ?? ""} className="max-w-full rounded" />}
      {caption && <figcaption className="mt-2 text-sm text-gray-600">{caption}</figcaption>}
    </figure>
  );
}

function TableBlockView({ table }: { table: TableBlock }) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead>
          <tr>
            {table.columns.map((column) => (
              <th key={column.id} className="border-b bg-gray-50 p-2 text-left">
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row) => (
            <tr key={row.id}>
              {table.columns.map((column) => (
                <td key={column.id} className="border-t p-2">
                  {row.cells[column.id]?.text}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
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

    case "media":
      return resource.mediaType === "audio" ? (
        <audio controls src={resource.src} className="mt-2 w-full" />
      ) : (
        <video controls src={resource.src} className="mt-2 w-full" />
      );

    case "external":
      return resource.uri ? (
        <div className="rounded bg-gray-50 p-2 text-sm">
          <a href={resource.uri} target="_blank" rel="noreferrer" className="underline">
            {resource.title ?? resource.uri}
          </a>
        </div>
      ) : null;
  }
}

function firstCaption(caption: Record<string, FormedText> | FormedText[] | undefined) {
  if (Array.isArray(caption)) return caption[0]?.text;
  return Object.values(caption ?? {})[0]?.text;
}

function formatTimeSpan(time: TimeSpan): string {
  if (time.end == null) return `[${formatSeconds(time.start)}]`;
  return `[${formatSeconds(time.start)} --> ${formatSeconds(time.end)}]`;
}

function formedTextValue(value: FormedText | string): string {
  return typeof value === "string" ? value : value.text;
}

function formedTextListValue(value: FormedText[] | string[] | string): string {
  if (typeof value === "string") return value;
  return value.map((item) => formedTextValue(item)).join(", ");
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
