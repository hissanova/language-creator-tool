import type { Document } from "../types/lcm";
import type { ViewerStyle } from "../types/viewerStyle";
import { ViewerShell } from "./ContentsViewer";

type Props = {
  document: Document;
  style?: ViewerStyle;
};

export function DevelopperViewer(props: Props) {
  return <ViewerShell {...props} annotationMode="developer" showMetadata />;
}
