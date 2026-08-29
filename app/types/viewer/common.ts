import type { FormId, LanguageId } from "../core/common";

export type ViewerMode = "developer" | "learner";

export type ViewerDensity = "full" | "compact" | "minimal";

export type CurrentLanguageFilter = "currentTranslation" | "any";
export type CurrentFormFilter = "currentForm" | "any";

export type LanguageFilter = LanguageId[] | CurrentLanguageFilter;
export type FormFilter = FormId[] | CurrentFormFilter;

export type LabelVisibilityOptions = {
  /**
   * Show Core JSON structural labels such as "ref", "mapping", "selector", "selection".
   * Developer mode normally enables this; learner mode normally disables this.
   */
  showCoreKindLabels?: boolean;

  /**
   * Show semantic labels such as "translation", "gloss", "note", "tag".
   * Learner mode can keep this enabled because these labels are meaningful to users.
   */
  showSemanticTypeLabels?: boolean;

  /** Replace or hide individual semantic labels without changing Core JSON values. */
  semanticTypeLabelOverrides?: Record<string, string | false>;

  /** Show internal Core JSON ids such as map-..., ref-..., selector-... */
  showIds?: boolean;

  /** Show selector ranges such as range: 5-9. */
  showRanges?: boolean;

  /** Show count badges such as Refs 2 or Selections 1. */
  showCounts?: boolean;
};

export type EmptyDisplayPolicy = "hide" | "showEmptyState";

export type ViewerDisplayBaseOptions = LabelVisibilityOptions & {
  density?: ViewerDensity;
  empty?: EmptyDisplayPolicy;
};
