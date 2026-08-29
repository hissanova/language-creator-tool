import type { Document } from "../types/core/document";
import type { ViewerStyle } from "../types/viewerStyle";
import { ViewerShell } from "./ViewerShell";
import { ConversationScriptLine } from "./script-line/ConversationScriptLine";

type Props = {
  document: Document;
  style?: ViewerStyle;
};

export function ConversationViewer(props: Props) {
  return (
    <ViewerShell
      {...props}
      LineComponent={ConversationScriptLine}
      showViewerControls
    />
  );
}
