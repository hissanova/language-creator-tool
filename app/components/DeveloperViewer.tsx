import type { Document } from "../types/core/document";
import type { ViewerStyle } from "../types/viewerStyle";
import type { MappingPresentationRule } from "../types/viewer/mappingPresentation";
import { ViewerShell } from "./ViewerShell";
import { DeveloperScriptLine } from "./script-line/DeveloperScriptLine";

type Props = {
  document: Document;
  style?: ViewerStyle;
  mappingPresentationRules?: readonly MappingPresentationRule[];
};

export function DeveloperViewer(props: Props) {
  return (
    <ViewerShell
      {...props}
      LineComponent={DeveloperScriptLine}
      showMetadata
    />
  );
}
