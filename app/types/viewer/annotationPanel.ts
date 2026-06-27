import type { FormId, LanguageId } from "../core/common";
import type { TextLineRef, SelectionRef } from "../core/references";
import type {
  Selection,
  SelectionType,
  TextMappingType,
} from "../core/textLine";
import type {
  EmptyDisplayPolicy,
  FormFilter,
  LanguageFilter,
  ViewerDisplayBaseOptions,
  ViewerMode,
} from "./common";

export type AnnotationPanelPlacement =
  | "line.below.collapsible"
  | "line.below"
  | "line.developerPanel";

/**
 * These names deliberately mirror the current Core JSON TextLine fields.
 *
 * - textLine.refs                  -> textLine.textLineRefs
 * - textLine.textMappings          -> textLine.textLineMappings
 * - textLine.selectorRecord        -> textLine.selectorRecord
 * - textLine.selectedTextRefs      -> textLine.selectedTextRefs
 * - textLine.selectedTextMappings  -> textLine.selectedTextMappings
 * - textLine.selections            -> textLine.selections
 * - textLine.resources             -> textLine.textLineRefs(resourceRef) + document.resources
 */
export type AnnotationPanelBlockSource =
  | "textLine.refs"
  | "textLine.textMappings"
  | "textLine.selectorRecord"
  | "textLine.selectedTextRefs"
  | "textLine.selectedTextMappings"
  | "textLine.selections"
  | "textLine.resources";

export type TextLineRefType = TextLineRef["body"]["type"];
export type SelectionRefType = SelectionRef["body"]["type"];
export type AnyRefType = TextLineRefType | SelectionRefType | string;

export type AnnotationPanelFilter = {
  /** Filter TextLineRef / SelectionRef by body.type. */
  refTypes?: AnyRefType[];

  /** Exclude refs by body.type. Useful for hiding speaker/alignment in learner mode. */
  excludeRefTypes?: AnyRefType[];

  /** Filter TextMappingPayload by mappingType. */
  mappingTypes?: Array<TextMappingType | string>;

  /** Exclude mappings by mappingType. */
  excludeMappingTypes?: Array<TextMappingType | string>;

  /** Filter Selection by selectionType. */
  selectionTypes?: Array<SelectionType | string>;

  /** Filter mapping image language. */
  languages?: LanguageFilter;

  /** Filter mapping image form. */
  formIds?: FormFilter;
};

export type MappingDisplayOptions = ViewerDisplayBaseOptions & {
  showMappingType?: boolean;
  showMappingId?: boolean;
  showMappingImageLanguage?: boolean;
  showMappingImageForm?: boolean;

  /** Render nested mapping.image TextLine details when they exist. */
  showNestedImageTextLine?: boolean;
};

export type RefDisplayOptions = ViewerDisplayBaseOptions & {
  showRefType?: boolean;
  showRefId?: boolean;
};

export type SelectorRecordDisplayOptions = ViewerDisplayBaseOptions & {
  showSelectorType?: boolean;
  showSelectorId?: boolean;
  showSelectedText?: boolean;
};

export type SelectionDisplayOptions = ViewerDisplayBaseOptions & {
  showSelectorChips?: boolean;

  showWholeSelectionMappings?: boolean;
  showWholeSelectionRefs?: boolean;

  showLocalSelectedTextMappings?: boolean;
  showLocalSelectedTextRefs?: boolean;

  /** Render nested mapping.image TextLine selections under the parent unit. */
  showNestedMappingImages?: boolean;

  /** Prevent overly deep or cyclic-looking nested selection displays. */
  maxDepth?: number;

  mappingOptions?: MappingDisplayOptions;
  refOptions?: RefDisplayOptions;
};

export type AnnotationPanelDisplayOptions = ViewerDisplayBaseOptions & {
  /** Optional block-level maximum nesting depth. */
  maxDepth?: number;

  mapping?: MappingDisplayOptions;
  ref?: RefDisplayOptions;
  selectorRecord?: SelectorRecordDisplayOptions;
  selection?: SelectionDisplayOptions;
};

export type AnnotationPanelSourceBlockConfig = {
  kind: "source";
  id: string;
  title?: string;
  source: AnnotationPanelBlockSource;
  filter?: AnnotationPanelFilter;
  options?: AnnotationPanelDisplayOptions;
};

export type AnnotationPanelGroupBlockConfig = {
  kind: "group";
  id: string;
  title: string;
  children: AnnotationPanelSourceBlockConfig[];
  options?: AnnotationPanelDisplayOptions;
};

export type AnnotationPanelBlockConfig =
  | AnnotationPanelSourceBlockConfig
  | AnnotationPanelGroupBlockConfig;

export type AnnotationPanelConfig = {
  id: string;
  mode: ViewerMode;
  placement: AnnotationPanelPlacement;

  /** Label used by the dropdown/details summary. Example: "Annotations". */
  summaryLabel?: string;

  /** Controls initial <details> state when rendered as line.below.collapsible. */
  defaultOpen?: boolean;

  /** Fallback used by child blocks unless they override it. */
  defaultOptions?: AnnotationPanelDisplayOptions;

  /** What blocks appear, and in what order. */
  blocks: AnnotationPanelBlockConfig[];

  /** Hide the whole annotation panel when all configured blocks are empty. */
  empty?: EmptyDisplayPolicy;
};

export type AnnotationPanelContextState = {
  /** Current Translation dropdown value. "none" means user selected Off. */
  translationLanguageId: LanguageId | "none";

  /** Current Form dropdown value. "none" means no alternate display form. */
  formId: FormId | "none";
};

export type SelectionDetailVariant = "developer" | "learner";

export type SelectionDetailConfig = {
  variant: SelectionDetailVariant;
  selection: SelectionDisplayOptions;
};

export type SelectionBlockCandidate = {
  selection: Selection;
  options: SelectionDisplayOptions;
};
