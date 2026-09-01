import type { ComponentType } from "react";
import type { Language, Resource, Speaker } from "../../types/core/document";
import type { TextLine } from "../../types/core/textLine";
import type { ViewerStyle } from "../../types/viewerStyle";
import type { LinePlaybackRange } from "../playback/playbackState";

export type ScriptLineCompositionProps = {
  textNode: TextLine;
  speakers: Speaker[];
  resources?: Resource[];
  defaultLanguageId?: string;
  languages?: Language[];
  formId: string;
  translationLanguageId: string;
  style: ViewerStyle;
  playbackRange?: LinePlaybackRange | null;
  hasPlaybackTiming?: boolean;
  isLoopSelected?: boolean;
  isLinePlaying?: boolean;
  loopEnabled?: boolean;
  onPause?: () => void;
  onPlayLine?: (range: LinePlaybackRange) => void;
  onToggleLineLoop?: (range: LinePlaybackRange) => void;
};

export type ScriptLineComponent = ComponentType<ScriptLineCompositionProps>;
