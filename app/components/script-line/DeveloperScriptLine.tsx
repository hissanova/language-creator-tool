import { ScriptLine } from "../ScriptLine";
import { buildScriptLineModel } from "./buildScriptLineModel";
import type { ScriptLineCompositionProps } from "./types";
import type { Resource } from "../../types/core/document";
import type { TextLine } from "../../types/core/textLine";
import type { SelectorAnnotation } from "./coreQueries";
import { AnnotationPanel } from "./AnnotationPanel";
import { developerAnnotationPanelConfig } from "../../config/annotationPanelPresets";

type Props = {
  textLine: TextLine;
  annotations: SelectorAnnotation[];
  nodeResources: Resource[];
  translationLanguageId: string;
};

function hasDeveloperAnnotationDetails({
  textLine,
  nodeResources,
}: Pick<Props, "textLine" | "nodeResources">) {
  return Boolean(
    textLine.textLineRefs?.length ||
      textLine.textLineMappings?.length ||
      Object.keys(textLine.selectorRecord ?? {}).length ||
      textLine.selectedTextRefs?.some((bundle) => bundle.attachments.length) ||
      textLine.selectedTextMappings?.some((bundle) => bundle.mappings.length) ||
      textLine.selections?.length ||
      nodeResources.length
  );
}

function DeveloperAnnotationPanel(props: Props) {
  const { textLine, annotations, nodeResources, translationLanguageId } = props;
  const dropdown = developerAnnotationPanelConfig.dropdown;
  const title = dropdown.title ?? "Annotations";

  return (
    <details className="mt-3 text-sm" open={dropdown.defaultOpen}>
      <summary className="cursor-pointer text-gray-800" aria-label={title}>
        {(dropdown.showTitle ?? true) && title}
      </summary>
      <div className="mt-2">
        <AnnotationPanel
          textLine={textLine}
          resources={nodeResources}
          annotations={annotations}
          translationLanguageId={translationLanguageId}
          config={developerAnnotationPanelConfig}
        />
      </div>
    </details>
  );
}

export function DeveloperScriptLine(props: ScriptLineCompositionProps) {
  const { translationLanguageId, style, canPlay, onPlay } = props;
  const model = buildScriptLineModel(props);
  const showAnnotationPanel =
    developerAnnotationPanelConfig.dropdown.enabled &&
    hasDeveloperAnnotationDetails({
      textLine: model.textNode,
      nodeResources: model.nodeResources,
    });

  return (
    <ScriptLine
      speaker={model.speaker}
      speakerId={model.speakerId}
      alignment={model.alignment}
      canPlay={canPlay}
      onPlay={onPlay}
      style={style}
      layoutVariant="inline"
      textContent={model.originalText}
      bottomSlot={showAnnotationPanel ? (
        <DeveloperAnnotationPanel
          textLine={model.textNode}
          annotations={model.annotations}
          nodeResources={model.nodeResources}
          translationLanguageId={translationLanguageId}
        />
      ) : undefined}
    />
  );
}
