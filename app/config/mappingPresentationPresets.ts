import type { MappingPresentationRule } from "../types/viewer/mappingPresentation";

export const defaultMappingPresentationRules: readonly MappingPresentationRule[] = [{
  id: "reading-ruby",
  match: { mappingTypes: ["reading"], formIds: "currentReading" },
  presentation: "ruby",
  placement: "above",
  order: 10,
}];
