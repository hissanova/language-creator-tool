import type { ViewerStyle } from "../types/viewerStyle";

/**
 * MVP用。
 * Next.jsでYAMLを直接importする設定をまだ入れない場合は、このTS版を使う。
 * style.yaml と同じ内容にしておく。
 */
export const viewerStyle: ViewerStyle = {
  tags: {
    grammar: {
      label: "Grammar",
      style: {
        color: "#1e3a8a",
        backgroundColor: "#dbeafe",
        borderColor: "#93c5fd",
      },
    },
    unnatural: {
      label: "Unnatural",
      style: {
        color: "#7c2d12",
        backgroundColor: "#ffedd5",
        borderColor: "#fdba74",
      },
    },
  },
  speakers: {
    simon: {
      nameColor: "#7c3aed",
    },
    lan: {
      nameColor: "#047857",
    },
  },
  layout: {
    main: "mx-auto max-w-4xl p-6",
    headerTitle: "mb-4 text-3xl font-bold",
    mediaBar: "sticky top-0 z-30 mb-6 rounded-xl border bg-white p-3 shadow-sm",
    controls: "mb-6 flex flex-wrap gap-3 rounded-xl border p-4",
    section: "rounded-2xl border p-5 shadow-sm",
    sectionHeader: "mb-4 flex items-center justify-between gap-4",
    sectionTitle: "text-xl font-bold",
    sectionTime: "text-sm text-gray-500",
    playButton: "rounded-full border px-4 py-2 text-sm hover:bg-gray-100",
    lines: "space-y-1",
  },
  speaker: {
    default: {
      container: "rounded-xl border p-1 border-gray-300 bg-gray-50",
      name: "mb-2 font-bold",
    },
    colors: {
      kanaa: {
        container: "rounded-xl border p-2 border-blue-300 bg-blue-50",
        name: "mb-2 font-bold",
      },
      green: {
        container: "rounded-xl border p-2 border-green-300 bg-green-50",
        name: "mb-2 font-bold",
      },
      purple: {
        container: "rounded-xl border p-2 border-purple-300 bg-purple-50",
        name: "mb-2 font-bold",
      },
      orange: {
        container: "rounded-xl border p-2 border-orange-300 bg-orange-50",
        name: "mb-2 font-bold",
      },
    },
  },
  text: {
    line: "text-xl leading-4 text-gray-900",
    annotated: "cursor-help px-0.5 underline decoration-dotted",
    annotationWithoutPopup: "px-0.5",
    translation: "mt-3 text-sm text-gray-600",
    form: "mt-2 text-sm text-gray-500",
    targetBlock: "mt-3 border-l-4 border-gray-200 pl-3",
    annotationBox: "mt-2 rounded bg-white/90 p-2 text-sm text-gray-950",
    annotationTitle: "font-semibold text-gray-900",
  },
  resource: {
    figure: "mt-4 rounded-lg border bg-white p-3",
    image: "max-h-64 rounded object-contain",
    caption: "mt-2 text-sm text-gray-600",
  },
};
