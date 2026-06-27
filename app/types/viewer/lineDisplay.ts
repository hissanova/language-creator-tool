import type { FormId, LanguageId } from "../core/common";
import type { ViewerMode } from "./common";

export type LineDisplaySlot =
  | "line.above"
  | "line.main.beforeText"
  | "line.main.text"
  | "line.main.afterText"
  | "line.below"
  | "line.below.collapsible"
  | "line.developerPanel";

/**
 * Line display sources are UI-level semantic sources, not raw Core JSON paths.
 *
 * The current annotation dropdown work should use AnnotationPanelConfig first.
 * This file is for the next step: controlling where line-level UI pieces appear.
 */
export type LineDisplaySource =
  | "ui.playButton"
  | "line.speaker"
  | "line.primaryText"
  | "line.languageBadge"
  | "line.translations"
  | "line.resources"
  | "line.annotationPanel";

export type LineDisplayMode =
  | "inline"
  | "block"
  | "details"
  | "panel"
  | "hoverTitle"
  | "chips";

export type LineDisplayFilter = {
  mappingTypes?: string[];
  refTypes?: string[];
  languages?: LanguageId[] | "currentTranslation" | "any";
  formIds?: FormId[] | "currentForm" | "any";
};

export type LineDisplayRule = {
  id: string;
  slot: LineDisplaySlot;
  source: LineDisplaySource;
  display: LineDisplayMode;
  filter?: LineDisplayFilter;
  options?: {
    collapsed?: boolean;
    showLabels?: boolean;
  };
};

export type LineDisplayConfig = {
  id: string;
  mode: ViewerMode;
  rules: LineDisplayRule[];
};
