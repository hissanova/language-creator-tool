import type { Document } from "../types/core/document";
import type { ViewerStyle } from "../types/viewerStyle";
import { ViewerShell } from "./ViewerShell";
import { DeveloperScriptLine } from "./script-line/DeveloperScriptLine";
import type { LineHighlightExperiment } from "../styles/scriptLinePresentation";

type Props = {
  document: Document;
  style?: ViewerStyle;
  lineHighlightExperiment: LineHighlightExperiment;
};

export function DeveloperViewer(props: Props) {
  return (
    <ViewerShell
      {...props}
      LineComponent={DeveloperScriptLine}
      lineHighlightExperiment={props.lineHighlightExperiment}
      showMetadata
    />
  );
}
