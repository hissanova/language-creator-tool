import type { Document } from "../types/core/document";
import type { ViewerStyle } from "../types/viewerStyle";
import { ViewerShell } from "./ConversationViewer";

type Props = {
  document: Document;
  style?: ViewerStyle;
};

export function DevelopperViewer(props: Props) {
  return <ViewerShell {...props} annotationMode="developer" showMetadata />;
}
