import type { MappingPresentationRule } from "../types/viewer/mappingPresentation";

export const defaultMappingPresentationRules: readonly MappingPresentationRule[] = [{
  id: "reading-above",
  match: { mappingTypes: ["reading"], formIds: "currentReading" },
  presentation: "alignedText",
  placement: "above",
  order: 10,
}];
