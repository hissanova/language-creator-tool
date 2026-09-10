"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { Document } from "../types/core/document";
import type { ViewerStyle } from "../types/viewerStyle";
import { ConversationViewer } from "./ConversationViewer";
import { DeveloperViewer } from "./DeveloperViewer";
import { TextViewer } from "./TextViewer";
import {
  DEFAULT_LINE_HIGHLIGHT_EXPERIMENT,
  parseLineHighlightExperiment,
  type LineHighlightExperiment,
} from "../styles/scriptLinePresentation";

type Props = {
  document: Document;
  style?: ViewerStyle;
};

type ViewerId = "conversation" | "text" | "developer";

type ViewerOption = {
  id: ViewerId;
  label: string;
};

function getViewerOptions(): ViewerOption[] {
  return [
    { id: "conversation", label: "Conversation viewer" },
    { id: "text", label: "Text viewer" },
    { id: "developer", label: "Developer viewer" },
  ];
}

function ViewerSwitcherContent({
  document,
  style,
  lineHighlightExperiment,
}: Props & { lineHighlightExperiment: LineHighlightExperiment }) {
  const viewerOptions = getViewerOptions();
  const [viewerId, setViewerId] = useState<ViewerId>(viewerOptions[0].id);

  const selectedViewer = viewerOptions.find((option) => option.id === viewerId) ?? viewerOptions[0];

  return (
    <>
      <div className="mx-auto max-w-4xl px-6 pt-6">
        <label className="inline-flex items-center gap-2 rounded border bg-white px-3 py-2 text-sm text-gray-950 shadow-sm">
          <span className="font-medium text-gray-800">Viewer</span>
          <select
            className="rounded border bg-white px-2 py-1 text-gray-950"
            value={selectedViewer.id}
            onChange={(event) => setViewerId(event.target.value as ViewerId)}
          >
            {viewerOptions.map((option) => (
              <option key={option.id} value={option.id} className="bg-white text-gray-950">
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {selectedViewer.id === "developer" ? (
        <DeveloperViewer
          document={document}
          style={style}
          lineHighlightExperiment={lineHighlightExperiment}
        />
      ) : selectedViewer.id === "text" ? (
        <TextViewer document={document} />
      ) : (
        <ConversationViewer
          document={document}
          style={style}
          lineHighlightExperiment={lineHighlightExperiment}
        />
      )}
    </>
  );
}

function ViewerSwitcherWithSearchParams(props: Props) {
  const searchParams = useSearchParams();
  const lineHighlightExperiment = parseLineHighlightExperiment({
    activeLineRail: searchParams.get("activeLineRail"),
    activeLineBackground: searchParams.get("activeLineBackground"),
    activeLineElevation: searchParams.get("activeLineElevation"),
  });

  return (
    <ViewerSwitcherContent
      {...props}
      lineHighlightExperiment={lineHighlightExperiment}
    />
  );
}

export function ViewerSwitcher(props: Props) {
  return (
    <Suspense
      fallback={(
        <ViewerSwitcherContent
          {...props}
          lineHighlightExperiment={DEFAULT_LINE_HIGHLIGHT_EXPERIMENT}
        />
      )}
    >
      <ViewerSwitcherWithSearchParams {...props} />
    </Suspense>
  );
}
