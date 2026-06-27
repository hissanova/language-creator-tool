import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

function parseScalar(value) {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function splitFrontMatter(source, sourceName) {
  const lines = source.replace(/\r\n?/g, "\n").split("\n");
  if (lines[0] !== "---") {
    throw new Error(`${sourceName}: expected front matter to start with ---`);
  }

  const closingIndex = lines.indexOf("---", 1);
  if (closingIndex === -1) {
    throw new Error(`${sourceName}: missing closing --- for front matter`);
  }

  return {
    frontMatterLines: lines.slice(1, closingIndex),
    bodyLines: lines.slice(closingIndex + 1),
  };
}

function parseFrontMatter(lines, sourceName) {
  const result = {};
  let currentList;
  let currentItem;

  for (let index = 0; index < lines.length; index += 1) {
    const raw = lines[index];
    if (!raw.trim()) continue;
    if (raw.includes("\t")) {
      throw new Error(`${sourceName}:${index + 2}: tabs are not supported in front matter`);
    }

    const indent = raw.match(/^ */)[0].length;
    const text = raw.trim();

    if (indent === 0) {
      const match = text.match(/^([^:]+):(?:\s+(.*))?$/);
      if (!match) throw new Error(`${sourceName}:${index + 2}: invalid front matter entry`);
      const [, key, value] = match;
      if (value == null) {
        result[key] = [];
        currentList = result[key];
        currentItem = undefined;
      } else {
        result[key] = parseScalar(value);
        currentList = undefined;
        currentItem = undefined;
      }
      continue;
    }

    if (indent === 2 && text.startsWith("- ") && currentList) {
      const match = text.slice(2).match(/^([^:]+):\s*(.*)$/);
      if (!match) throw new Error(`${sourceName}:${index + 2}: invalid list item`);
      currentItem = { [match[1]]: parseScalar(match[2]) };
      currentList.push(currentItem);
      continue;
    }

    if (indent === 4 && currentItem) {
      const match = text.match(/^([^:]+):\s*(.*)$/);
      if (!match) throw new Error(`${sourceName}:${index + 2}: invalid object property`);
      currentItem[match[1]] = parseScalar(match[2]);
      continue;
    }

    throw new Error(`${sourceName}:${index + 2}: unsupported front matter indentation`);
  }

  return result;
}

function parseIndentedNodes(lines, sourceName, startingLine) {
  const root = { indent: -1, children: [] };
  const stack = [root];

  lines.forEach((raw, offset) => {
    if (!raw.trim()) return;
    if (raw.includes("\t")) {
      throw new Error(`${sourceName}:${startingLine + offset}: tabs are not supported`);
    }

    const indent = raw.match(/^ */)[0].length;
    const node = {
      indent,
      text: raw.trim(),
      lineNumber: startingLine + offset,
      children: [],
    };

    while (stack.at(-1).indent >= indent) stack.pop();
    stack.at(-1).children.push(node);
    stack.push(node);
  });

  return root.children;
}

function parseTimestamp(value, sourceName, lineNumber) {
  const match = value.match(/^(\d{2}):(\d{2}):(\d{2}),(\d{3})$/);
  if (!match) throw new Error(`${sourceName}:${lineNumber}: invalid timestamp ${value}`);
  const [, hours, minutes, seconds, milliseconds] = match;
  return (
    Number(hours) * 3600 +
    Number(minutes) * 60 +
    Number(seconds) +
    Number(milliseconds) / 1000
  );
}

function mappingSpec(text, sourceName, lineNumber) {
  const raw = text.slice(2).trim().replace(/:$/, "").trim();
  const languageMatch = raw.match(/(?:^|\s)lang:([^\s:]+)/);
  if (!languageMatch) {
    throw new Error(`${sourceName}:${lineNumber}: mapping is missing lang:<id>`);
  }

  const type = raw.slice(0, languageMatch.index).trim() || "translation";
  return { mappingType: type, languageId: languageMatch[1] };
}

function quotedParts(text) {
  return Array.from(text.matchAll(/"([^"]+)"/g), (match) => match[1]);
}

function pushValue(owner, key, value) {
  if (!owner[key]) owner[key] = [];
  owner[key].push(value);
}

export class MinimumLcmCompiler {
  constructor(frontMatter, sourceName) {
    this.frontMatter = frontMatter;
    this.sourceName = sourceName;
    this.slug = path.basename(sourceName, path.extname(sourceName));
    this.counts = new Map();
  }

  nextId(kind) {
    const count = (this.counts.get(kind) ?? 0) + 1;
    this.counts.set(kind, count);
    return `${this.slug}-${kind}-${String(count).padStart(3, "0")}`;
  }

  createTextLine(text, languageId, formId) {
    return {
      id: this.nextId("line"),
      content: {
        text,
        languageId: languageId ?? this.frontMatter.defaultLanguageId,
        formId: formId ?? this.frontMatter.defaultFormId ?? "surface",
      },
    };
  }

  addSelector(textLine, start, end) {
    const selectorId = this.nextId("selector");
    if (!textLine.selectorRecord) textLine.selectorRecord = {};
    textLine.selectorRecord[selectorId] = {
      selectorType: "range",
      range: { start, end },
    };
    return selectorId;
  }

  findSingleRange(text, target, node) {
    const start = text.indexOf(target);
    if (start === -1) {
      throw new Error(
        `${this.sourceName}:${node.lineNumber}: selector text ${JSON.stringify(target)} was not found`,
      );
    }
    if (text.indexOf(target, start + 1) !== -1) {
      throw new Error(
        `${this.sourceName}:${node.lineNumber}: selector text ${JSON.stringify(target)} has multiple matches; occurrence syntax is not supported yet`,
      );
    }
    return { start, end: start + target.length };
  }

  addDecomposition(textLine, node) {
    const parts = quotedParts(node.text);
    if (parts.length < 2) {
      throw new Error(`${this.sourceName}:${node.lineNumber}: expected a decomposition selector`);
    }

    let cursor = 0;
    const selectorIds = parts.map((part) => {
      const start = textLine.content.text.indexOf(part, cursor);
      if (start === -1) {
        throw new Error(
          `${this.sourceName}:${node.lineNumber}: could not resolve ${JSON.stringify(part)} left-to-right in ${JSON.stringify(textLine.content.text)}`,
        );
      }
      cursor = start + part.length;
      return this.addSelector(textLine, start, cursor);
    });

    const selection = {
      id: this.nextId("selection"),
      selectorIds,
      selectionType: "decomposition",
      label: parts.join(" | "),
    };
    pushValue(textLine, "selections", selection);
    this.processSelectionChildren(textLine, selection, node.children);
    return selection;
  }

  createMapping(node) {
    const spec = mappingSpec(node.text, this.sourceName, node.lineNumber);
    const valueNode = node.children.find((child) => !child.text.startsWith("@"));
    if (!valueNode) {
      throw new Error(`${this.sourceName}:${node.lineNumber}: mapping is missing output text`);
    }

    const image = this.createTextLine(valueNode.text, spec.languageId, "surface");
    if (valueNode.children.length) this.processTextLineNodes(image, valueNode.children);

    return {
      id: this.nextId("map"),
      mappingType: spec.mappingType,
      image,
    };
  }

  createRef(node) {
    if (node.text === "+tag:") {
      const tags = node.children
        .filter((child) => child.text.startsWith("- "))
        .map((child) => child.text.slice(2).trim());
      if (!tags.length) throw new Error(`${this.sourceName}:${node.lineNumber}: tag ref is empty`);
      return {
        id: this.nextId("ref"),
        body: { type: "tag", tags },
      };
    }

    if (node.text === "+note:") {
      const valueNode = node.children[0];
      if (!valueNode) throw new Error(`${this.sourceName}:${node.lineNumber}: note ref is empty`);
      return {
        id: this.nextId("ref"),
        body: { type: "note", noteType: "editorial", text: valueNode.text },
      };
    }

    throw new Error(`${this.sourceName}:${node.lineNumber}: unsupported ref ${node.text}`);
  }

  mappingBundle(owner, key, source) {
    if (!owner[key]) owner[key] = [];
    let bundle = owner[key].find((candidate) => candidate.source === source);
    if (!bundle) {
      bundle = { id: this.nextId("mapping-bundle"), source, mappings: [] };
      owner[key].push(bundle);
    }
    return bundle;
  }

  refBundle(owner, key, source) {
    if (!owner[key]) owner[key] = [];
    let bundle = owner[key].find((candidate) => candidate.source === source);
    if (!bundle) {
      bundle = { id: this.nextId("ref-bundle"), source, attachments: [] };
      owner[key].push(bundle);
    }
    return bundle;
  }

  attachLocalRef(selection, source, ref) {
    const bundle = this.refBundle(selection, "localSelectedTextRefs", source);
    bundle.attachments.push({ id: this.nextId("attachment"), ref });
  }

  selectorText(textLine, selectorId) {
    const selector = textLine.selectorRecord?.[selectorId];
    if (!selector || selector.selectorType !== "range") {
      throw new Error(`${this.sourceName}: unresolved selector ${selectorId}`);
    }
    return textLine.content.text.slice(selector.range.start, selector.range.end);
  }

  processLineActions(textLine, nodes) {
    for (const node of nodes) {
      if (node.text.startsWith("->")) {
        pushValue(textLine, "textLineMappings", this.createMapping(node));
      } else if (node.text.startsWith("+")) {
        pushValue(textLine, "textLineRefs", this.createRef(node));
      } else {
        throw new Error(`${this.sourceName}:${node.lineNumber}: unsupported @line action ${node.text}`);
      }
    }
  }

  processDirectSelector(textLine, node, part) {
    const range = this.findSingleRange(textLine.content.text, part, node);
    const selectorId = this.addSelector(textLine, range.start, range.end);

    for (const child of node.children) {
      if (child.text.startsWith("->")) {
        const bundle = this.mappingBundle(textLine, "selectedTextMappings", selectorId);
        bundle.mappings.push(this.createMapping(child));
      } else if (child.text.startsWith("+")) {
        const bundle = this.refBundle(textLine, "selectedTextRefs", selectorId);
        bundle.attachments.push({
          id: this.nextId("attachment"),
          ref: this.createRef(child),
        });
      } else {
        throw new Error(`${this.sourceName}:${child.lineNumber}: unsupported selector action ${child.text}`);
      }
    }
  }

  processPosition(textLine, selection, node) {
    const position = Number(node.text.slice(1));
    const selectorId = selection.selectorIds[position - 1];
    if (!Number.isInteger(position) || !selectorId) {
      throw new Error(`${this.sourceName}:${node.lineNumber}: invalid positional selector ${node.text}`);
    }

    for (const child of node.children) {
      if (child.text.startsWith("->")) {
        const bundle = this.mappingBundle(
          selection,
          "localSelectedTextMappings",
          selectorId,
        );
        bundle.mappings.push(this.createMapping(child));
      } else if (child.text.startsWith("+")) {
        this.attachLocalRef(selection, selectorId, this.createRef(child));
      } else if (child.text.startsWith('@"')) {
        const localSource = this.createTextLine(
          this.selectorText(textLine, selectorId),
          textLine.content.languageId,
          textLine.content.formId,
        );
        this.processTextLineNodes(localSource, [child]);
        const bundle = this.mappingBundle(
          selection,
          "localSelectedTextMappings",
          selectorId,
        );
        bundle.mappings.push({
          id: this.nextId("map"),
          mappingType: "localSource",
          image: localSource,
        });
      } else {
        throw new Error(`${this.sourceName}:${child.lineNumber}: unsupported positional action ${child.text}`);
      }
    }
  }

  processSelectionChildren(textLine, selection, nodes) {
    for (const node of nodes) {
      if (node.text.startsWith("+")) {
        pushValue(selection, "selectionRefs", this.createRef(node));
      } else if (node.text.startsWith("->")) {
        pushValue(selection, "selectionMappings", this.createMapping(node));
      } else if (/^@\d+$/.test(node.text)) {
        this.processPosition(textLine, selection, node);
      } else {
        throw new Error(`${this.sourceName}:${node.lineNumber}: unsupported selection action ${node.text}`);
      }
    }
  }

  processTextLineNodes(textLine, nodes) {
    for (const node of nodes) {
      if (node.text === "@line") {
        this.processLineActions(textLine, node.children);
        continue;
      }

      if (node.text.startsWith('@"')) {
        const parts = quotedParts(node.text);
        if (parts.length === 1) this.processDirectSelector(textLine, node, parts[0]);
        else this.addDecomposition(textLine, node);
        continue;
      }

      throw new Error(`${this.sourceName}:${node.lineNumber}: unsupported annotation ${node.text}`);
    }
  }

  compile(bodyLines, bodyStartingLine) {
    const metadata = {
      specVersion: this.frontMatter.specVersion ?? "0.5-draft",
      title: this.frontMatter.title,
      documentType: this.frontMatter.documentType ?? "text",
      defaultLanguageId: this.frontMatter.defaultLanguageId,
      defaultFormId: this.frontMatter.defaultFormId ?? "surface",
    };
    for (const key of ["languages", "forms", "speakers"]) {
      if (this.frontMatter[key]) metadata[key] = this.frontMatter[key];
    }

    const document = { metadata, sections: [] };
    if (this.frontMatter.resources) document.resources = this.frontMatter.resources;

    let section;
    let index = 0;
    while (index < bodyLines.length) {
      const raw = bodyLines[index];
      const text = raw.trim();
      const lineNumber = bodyStartingLine + index;
      if (!text) {
        index += 1;
        continue;
      }

      if (raw.startsWith("# ")) {
        section = {
          id: this.nextId("section"),
          title: raw.slice(2).trim(),
          level: 1,
          blocks: [],
        };
        document.sections.push(section);
        index += 1;
        continue;
      }

      if (!section) throw new Error(`${this.sourceName}:${lineNumber}: text appears before a section`);

      let interval;
      const timestampMatch = text.match(/^(\S+)\s+-->\s+(\S+)$/);
      if (timestampMatch) {
        interval = {
          start: parseTimestamp(timestampMatch[1], this.sourceName, lineNumber),
          end: parseTimestamp(timestampMatch[2], this.sourceName, lineNumber),
        };
        index += 1;
      }

      const lineRaw = bodyLines[index];
      const lineMatch = lineRaw?.match(/^>([^:]*):\s*(.*)$/);
      if (!lineMatch) {
        throw new Error(`${this.sourceName}:${bodyStartingLine + index}: expected a text line`);
      }
      const [, speakerId, lineText] = lineMatch;
      const textLine = this.createTextLine(lineText);

      if (speakerId) {
        pushValue(textLine, "textLineRefs", {
          id: this.nextId("ref-speaker"),
          body: { type: "speaker", speakerId },
        });
      }
      if (interval) {
        const media = document.resources?.find((resource) => resource.type === "media");
        if (!media) {
          throw new Error(`${this.sourceName}:${lineNumber}: timestamped line needs a media resource`);
        }
        pushValue(textLine, "textLineRefs", {
          id: this.nextId("ref-alignment"),
          body: {
            type: "alignment",
            mediaRef: { resourceId: media.id },
            interval,
          },
        });
      }

      section.blocks.push({ type: "text", text: textLine });
      index += 1;

      const annotationStart = index;
      while (index < bodyLines.length) {
        const candidate = bodyLines[index];
        if (candidate.trim() && candidate.match(/^ */)[0].length === 0) break;
        index += 1;
      }
      const annotationNodes = parseIndentedNodes(
        bodyLines.slice(annotationStart, index),
        this.sourceName,
        bodyStartingLine + annotationStart,
      );
      this.processTextLineNodes(textLine, annotationNodes);
    }

    validateUniqueIds(document, this.sourceName);
    return document;
  }
}

function validateUniqueIds(document, sourceName) {
  const ids = new Set();

  function add(id) {
    if (ids.has(id)) throw new Error(`${sourceName}: duplicate generated id ${id}`);
    ids.add(id);
  }

  function walk(value) {
    if (!value || typeof value !== "object") return;
    if (Object.hasOwn(value, "id") && typeof value.id === "string") add(value.id);
    if (value.selectorRecord) Object.keys(value.selectorRecord).forEach(add);
    Object.values(value).forEach(walk);
  }

  walk(document);
}

export function compileLcm(source, sourceName = "document.lcm") {
  const { frontMatterLines, bodyLines } = splitFrontMatter(source, sourceName);
  const frontMatter = parseFrontMatter(frontMatterLines, sourceName);
  if (!frontMatter.title) throw new Error(`${sourceName}: front matter title is required`);
  if (!frontMatter.defaultLanguageId) {
    throw new Error(`${sourceName}: front matter defaultLanguageId is required`);
  }
  const compiler = new MinimumLcmCompiler(frontMatter, sourceName);
  return compiler.compile(bodyLines, frontMatterLines.length + 3);
}

export async function compileLcmFile(filePath) {
  return compileLcm(await readFile(filePath, "utf8"), filePath);
}

export async function compileLcmToDocument(inputPath) {
  return compileLcmFile(inputPath);
}

export function generatedExportName(filePath) {
  const base = path.basename(filePath, path.extname(filePath));
  return `${base.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())}Generated`;
}

function validateExportName(exportName) {
  if (!/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(exportName)) {
    throw new Error(`${JSON.stringify(exportName)} is not a valid TypeScript export name`);
  }
}

export function serializeGeneratedFixture(
  document,
  sourcePath,
  exportName = generatedExportName(sourcePath),
) {
  validateExportName(exportName);
  const relativeSource = path.relative(process.cwd(), sourcePath).replaceAll(path.sep, "/");

  return `// Generated from ${relativeSource}.\n// Do not edit this file by hand.\n\nimport type { Document } from "@/app/types/core/document";\n\nexport const ${exportName}: Document = ${JSON.stringify(document, null, 2)};\n`;
}

export async function writeDocumentModule({ document, inputPath, outputPath, exportName }) {
  const moduleSource = serializeGeneratedFixture(document, inputPath, exportName);
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, moduleSource, "utf8");
}
