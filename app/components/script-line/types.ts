import type { ComponentType } from "react";
import type { Language, Resource, Speaker } from "../../types/core/document";
import type { TextLine } from "../../types/core/textLine";
import type { ViewerStyle } from "../../types/viewerStyle";
import type { MappingPresentationRule } from "../../types/viewer/mappingPresentation";
import type { LinePlaybackRange } from "../playback/playbackState";

export type ScriptLineCompositionProps = {
  textNode: TextLine;
  speakers: Speaker[];
  resources?: Resource[];
  defaultLanguageId?: string;
  languages?: Language[];
  formId: string;
  selectedReadingFormId: string | null;
  translationLanguageId: string;
  style: ViewerStyle;
  mappingPresentationRules?: readonly MappingPresentationRule[];
  playbackRange?: LinePlaybackRange | null;
  hasPlaybackTiming?: boolean;
  isRangeLocked?: boolean;
  isCurrentPlaybackLine?: boolean;
  onPlayLine?: (range: LinePlaybackRange) => void;
  onToggleLineLock?: (range: LinePlaybackRange) => void;
};

export type ScriptLineComponent = ComponentType<ScriptLineCompositionProps>;
