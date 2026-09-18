import type { Document } from "../../app/types/core/document";

export type ViewerSampleEntry = {
  readonly id: string;
  readonly label: string;
  readonly generated: boolean;
  readonly load: () => Promise<Document>;
};

export const viewerSamples: readonly ViewerSampleEntry[] = [
  {
    id: "viewer-conversation-smoke",
    label: "Viewer conversation smoke",
    generated: true,
    load: async () => (await import("./generated/viewer-conversation-smoke.generated")).viewerConversationSmokeGenerated,
  },
  {
    id: "decomposition-minimum",
    label: "Decomposition minimum",
    generated: true,
    load: async () => (await import("./generated/decomposition-minimum.generated")).decompositionMinimumGenerated,
  },
  {
    id: "decomposition-nested-minimum",
    label: "Decomposition nested minimum",
    generated: true,
    load: async () => (await import("./generated/decomposition-nested-minimum.generated")).decompositionNestedMinimumGenerated,
  },
  {
    id: "conversation-chinese-medium",
    label: "Chinese conversation medium",
    generated: true,
    load: async () => (await import("../conversation-zh-episode/core-json/sample-episode-zh-reduced")).conversationSampleChinese2,
  },
  {
    id: "lcm-cheat-sheet",
    label: "LCM cheat sheet",
    generated: true,
    load: async () => (await import("./generated/lcm-cheat-sheet.generated")).lcmCheatSheetGenerated,
  },
  {
    id: "reading-kana",
    label: "Reading kana",
    generated: true,
    load: async () => (await import("./generated/reading-kana.generated")).readingKanaGenerated,
  },
  {
    id: "reading-chinese",
    label: "Reading Chinese",
    generated: true,
    load: async () => (await import("./generated/reading-chinese.generated")).readingChineseGenerated,
  },
];

export function findViewerSample(id: string): ViewerSampleEntry | undefined {
  return viewerSamples.find((sample) => sample.id === id);
}

export function viewerSampleStaticParams(): { sampleId: string }[] {
  return viewerSamples.map(({ id }) => ({ sampleId: id }));
}
