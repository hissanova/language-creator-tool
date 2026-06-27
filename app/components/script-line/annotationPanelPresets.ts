import type { AnnotationPanelConfig } from "../../types/viewer";

export const developerAnnotationPanelConfig = {
  id: "developer-annotation-panel",
  mode: "developer",
  placement: "line.developerPanel",
  summaryLabel: "Annotations",
  defaultOpen: false,
  empty: "hide",
  defaultOptions: {
    showCoreKindLabels: true,
    showSemanticTypeLabels: true,
    showIds: true,
    showRanges: true,
    showCounts: true,
    empty: "hide",
    maxDepth: 99,
    selection: {
      showSelectorChips: true,
      showWholeSelectionMappings: true,
      showWholeSelectionRefs: true,
      showLocalSelectedTextMappings: true,
      showLocalSelectedTextRefs: true,
      showNestedMappingImages: true,
      maxDepth: 99,
    },
  },
  blocks: [
    {
      kind: "group",
      id: "whole-line",
      title: "Whole-line",
      children: [
        {
          kind: "source",
          id: "whole-line-refs",
          title: "Refs",
          source: "textLine.refs",
        },
        {
          kind: "source",
          id: "whole-line-text-mappings",
          title: "Text mappings",
          source: "textLine.textMappings",
        },
      ],
    },
    {
      kind: "source",
      id: "selector-record",
      title: "Selector record",
      source: "textLine.selectorRecord",
    },
    {
      kind: "source",
      id: "selected-text-refs",
      title: "Selected text refs",
      source: "textLine.selectedTextRefs",
    },
    {
      kind: "source",
      id: "selected-text-mappings",
      title: "Selected text mappings",
      source: "textLine.selectedTextMappings",
    },
    {
      kind: "source",
      id: "selections",
      title: "Selections",
      source: "textLine.selections",
    },
    {
      kind: "source",
      id: "resources",
      title: "Resources",
      source: "textLine.resources",
    },
  ],
} satisfies AnnotationPanelConfig;
