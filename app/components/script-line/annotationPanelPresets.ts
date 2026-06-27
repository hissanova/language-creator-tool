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

export const learnerAnnotationPanelConfig = {
  id: "learner-annotation-panel",
  mode: "learner",
  placement: "line.below.collapsible",
  summaryLabel: "Annotations",
  defaultOpen: false,
  empty: "hide",
  defaultOptions: {
    showCoreKindLabels: false,
    showSemanticTypeLabels: true,
    showIds: false,
    showRanges: false,
    showCounts: false,
    empty: "hide",
    maxDepth: 3,
    selection: {
      showSelectorChips: true,
      showWholeSelectionMappings: true,
      showWholeSelectionRefs: true,
      showLocalSelectedTextMappings: true,
      showLocalSelectedTextRefs: true,
      showNestedMappingImages: true,
      maxDepth: 3,
    },
  },
  blocks: [
    {
      kind: "group",
      id: "learner-line-annotations",
      title: "Line annotations",
      children: [
        {
          kind: "source",
          id: "learner-line-refs",
          title: "Refs",
          source: "textLine.refs",
          filter: {
            refTypes: ["tag", "note", "dictionary"],
          },
        },
      ],
    },
    {
      kind: "group",
      id: "learner-selected-text-annotations",
      title: "Selected text annotations",
      children: [
        {
          kind: "source",
          id: "learner-selected-text-mappings",
          title: "Selected text mappings",
          source: "textLine.selectedTextMappings",
          filter: {
            mappingTypes: ["gloss", "translation"],
          },
          options: {
            showCoreKindLabels: false,
            showSemanticTypeLabels: true,
            showIds: false,
            showRanges: false,
          },
        },
        {
          kind: "source",
          id: "learner-selected-text-refs",
          title: "Selected text refs",
          source: "textLine.selectedTextRefs",
          filter: {
            refTypes: ["tag", "note", "dictionary"],
          },
          options: {
            showCoreKindLabels: false,
            showSemanticTypeLabels: true,
            showIds: false,
            showRanges: false,
          },
        },
      ],
    },
    {
      kind: "source",
      id: "learner-selections",
      title: "Selections",
      source: "textLine.selections",
      filter: {
        selectionTypes: ["decomposition", "parallel"],
      },
      options: {
        showCoreKindLabels: false,
        showSemanticTypeLabels: true,
        showIds: false,
        showRanges: false,
        selection: {
          showSelectorChips: true,
          showWholeSelectionMappings: true,
          showWholeSelectionRefs: true,
          showLocalSelectedTextMappings: true,
          showLocalSelectedTextRefs: true,
          showNestedMappingImages: true,
          maxDepth: 3,
        },
      },
    },
  ],
} satisfies AnnotationPanelConfig;
