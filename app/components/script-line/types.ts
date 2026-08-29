import type { ComponentType } from "react";
import type { TimeSpan } from "../../types/core/common";
import type { Language, Resource, Speaker } from "../../types/core/document";
import type { TextLine } from "../../types/core/textLine";
import type { ViewerStyle } from "../../types/viewerStyle";

export type ScriptLineCompositionProps = {
  textNode: TextLine;
  speakers: Speaker[];
  resources?: Resource[];
  defaultLanguageId?: string;
  languages?: Language[];
  formId: string;
  translationLanguageId: string;
  style: ViewerStyle;
  canPlay?: boolean;
  onPlay?: (interval: TimeSpan) => void;
};

export type ScriptLineComponent = ComponentType<ScriptLineCompositionProps>;
