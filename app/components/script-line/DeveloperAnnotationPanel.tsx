import type { Resource } from "../../types/core/document";
import type { TextLine } from "../../types/core/textLine";
import type { ViewerStyle } from "../../types/viewerStyle";
import type { SelectorAnnotation } from "./coreQueries";
import { AnnotationPanel } from "./AnnotationPanel";
import { developerAnnotationPanelConfig } from "./annotationPanelPresets";

type Props = {
  textLine: TextLine;
  annotations: SelectorAnnotation[];
  textNodeTags: string[];
  nodeResources: Resource[];
  translationLanguageId: string;
  style: ViewerStyle;
};

export function DeveloperAnnotationPanel(props: Props) {
  const {
    textLine,
    annotations,
    nodeResources,
    translationLanguageId,
  } = props;
  const hasDetails = Boolean(
    textLine.textLineRefs?.length ||
      textLine.textLineMappings?.length ||
      Object.keys(textLine.selectorRecord ?? {}).length ||
      textLine.selectedTextRefs?.some((bundle) => bundle.attachments.length) ||
      textLine.selectedTextMappings?.some((bundle) => bundle.mappings.length) ||
      textLine.selections?.length ||
      nodeResources.length
  );

  if (!hasDetails) return null;

  const dropdown = developerAnnotationPanelConfig.dropdown;
  if (!dropdown.enabled) return null;
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
