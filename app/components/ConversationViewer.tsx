import type { Document } from "../types/core/document";
import type { ViewerStyle } from "../types/viewerStyle";
import type { MappingPresentationRule } from "../types/viewer/mappingPresentation";
import { ViewerShell } from "./ViewerShell";
import { ConversationScriptLine } from "./script-line/ConversationScriptLine";
import type { ViewerSettingsOwnerProps } from "./viewer-options/viewerSettingsTypes";

type Props = ViewerSettingsOwnerProps & {
  document: Document;
  style?: ViewerStyle;
  mappingPresentationRules?: readonly MappingPresentationRule[];
};

export function ConversationViewer(props: Props) {
  return (
    <ViewerShell
      {...props}
      LineComponent={ConversationScriptLine}
    />
  );
}
