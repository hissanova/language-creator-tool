import type { AnnotationPanelDisplayOptions } from "../../types/viewer";

export function semanticTypeLabel(
  semanticType: string,
  options?: AnnotationPanelDisplayOptions,
) {
  if (!(options?.showSemanticTypeLabels ?? true)) return undefined;
  const override = options?.semanticTypeLabelOverrides?.[semanticType];
  return override === false ? undefined : override ?? semanticType;
}
