"use client";

import { useMemo, useState } from "react";
import type { Document } from "../types/lcm";
import type { ViewerStyle } from "../types/viewerStyle";
import { ConversationViewer } from "./ConversationViewer";
import { DevelopperViewer } from "./DevelopperViewer";

type Props = {
  document: Document;
  style?: ViewerStyle;
};

type ViewerId = "conversation" | "developper";

type ViewerOption = {
  id: ViewerId;
  label: string;
};

function getViewerOptions(document: Document): ViewerOption[] {
  if (document.metadata.documentType === "conversation") {
    return [
      { id: "conversation", label: "Conversation viewer" },
      { id: "developper", label: "Developper viewer" },
    ];
  }

  return [
    { id: "conversation", label: "Contents viewer" },
    { id: "developper", label: "Developper viewer" },
  ];
}

export function ViewerSwitcher({ document, style }: Props) {
  const viewerOptions = useMemo(() => getViewerOptions(document), [document]);
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

      {selectedViewer.id === "developper" ? (
        <DevelopperViewer document={document} style={style} />
      ) : (
        <ConversationViewer document={document} style={style} />
      )}
    </>
  );
}
