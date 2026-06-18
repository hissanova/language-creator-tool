import type {
  Document,
  FigureBlock,
  FormedText,
  NoteBlock,
  Resource,
  Section,
  SectionBlock,
  SelectorNode,
  TableBlock,
  TextNode,
  TextNodeRef,
  TimeSpan,
} from "../types/lcm";

type SpeakerRef = TextNodeRef & {
  body: { type: "speaker"; speakerId: string };
};

type AlignmentRef = TextNodeRef & {
  body: { type: "alignment"; interval: TimeSpan };
};

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

      {section.sections?.map((child) => (
        <SectionView key={child.id} section={child} resources={resources} />
      ))}
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
  }
}

function SectionBlockView({ block, resources }: { block: SectionBlock; resources: Resource[] }) {
  switch (block.type) {
    case "text":
      return <TextNodeView textNode={block.text} resources={resources} />;
    case "note":
      return <NoteBlockView note={block.note} />;
    case "figure":
      return <FigureBlockView figure={block.figure} resources={resources} />;
    case "table":
      return <TableBlockView table={block.table} />;
  }
}

function TextNodeView({ textNode, resources }: { textNode: TextNode; resources: Resource[] }) {
  const speaker = textNode.refs?.find(
    (ref): ref is SpeakerRef => ref.body.type === "speaker"
  )?.body.speakerId;
  const alignment = textNode.refs?.find(
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
        <span className="text-lg">{textNode.content.text}</span>
      </div>

      {textNode.transforms?.map((transform) => (
        <div key={transform.id} className="mt-2 rounded bg-gray-50 p-2 text-sm">
          <span className="font-semibold">{transform.transformType}: </span>
          {transform.output.content.text}
        </div>
      ))}

      {textNode.refs?.map((refValue) => (
        <RefView key={refValue.id} body={refValue.body} resources={resources} />
      ))}

      {textNode.selectors?.map((selector) => (
        <SelectorView key={selector.id} selector={selector} resources={resources} />
      ))}
    </div>
  );
}

function SelectorView({ selector, resources }: { selector: SelectorNode; resources: Resource[] }) {
  return (
    <div className="mt-3 border-l-4 border-gray-200 pl-3">
      <div className="text-sm font-semibold text-gray-700">
        {selector.label ?? selector.selectorType}
        {selector.selectedRanges?.length ? (
          <span className="ml-2 font-normal text-gray-500">
            {selector.selectedRanges.map((range) => `${range.start}-${range.end}`).join(", ")}
          </span>
        ) : null}
      </div>

      {selector.children.map((child) => (
        <TextNodeView key={child.id} textNode={child} resources={resources} />
      ))}

      {selector.refs?.map((refValue) => (
        <RefView key={refValue.id} body={refValue.body} resources={resources} />
      ))}
    </div>
  );
}

function RefView({
  body,
  resources,
}: {
  body: NonNullable<TextNode["refs"]>[number]["body"] | NonNullable<SelectorNode["refs"]>[number]["body"];
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

    case "relation":
      return <AnnotationBox title="Relation">{body.label ?? body.relationType}</AnnotationBox>;
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
      <p>{note.text}</p>
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
  const resource =
    figure.resourceRef &&
    resources.find(
      (candidate): candidate is Extract<Resource, { type: "image" }> =>
        candidate.id === figure.resourceRef?.resourceId && candidate.type === "image"
    );
  const src = figure.src ?? resource?.src;
  const alt = figure.alt ?? resource?.alt ?? "";
  const caption = Object.values(figure.caption ?? resource?.caption ?? {})[0]?.text;

  return (
    <figure className="rounded-lg border bg-gray-50 p-4">
      {src && <img src={src} alt={alt} className="max-w-full rounded" />}
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
              <th key={column} className="border-b bg-gray-50 p-2 text-left">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="border-t p-2">
                  {cell.text}
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
