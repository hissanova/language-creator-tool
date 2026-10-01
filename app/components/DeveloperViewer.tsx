import type { Document } from "../types/core/document";
import type { ViewerStyle } from "../types/viewerStyle";
import type { MappingPresentationRule } from "../types/viewer/mappingPresentation";
import { ViewerShell } from "./ViewerShell";
import { DeveloperScriptLine } from "./script-line/DeveloperScriptLine";
import type { ViewerSettingsOwnerProps } from "./viewer-options/viewerSettingsTypes";

type Props = ViewerSettingsOwnerProps & {
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
