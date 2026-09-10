import type { Document } from "../types/core/document";
import type { ViewerStyle } from "../types/viewerStyle";
import { ViewerShell } from "./ViewerShell";
import { ConversationScriptLine } from "./script-line/ConversationScriptLine";
import type { LineHighlightExperiment } from "../styles/scriptLinePresentation";

type Props = {
  document: Document;
  style?: ViewerStyle;
  lineHighlightExperiment: LineHighlightExperiment;
};

export function ConversationViewer(props: Props) {
  return (
    <ViewerShell
      {...props}
      LineComponent={ConversationScriptLine}
      lineHighlightExperiment={props.lineHighlightExperiment}
      showViewerControls
    />
  );
}
