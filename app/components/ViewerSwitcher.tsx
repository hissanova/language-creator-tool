"use client";

import { useState } from "react";
import type { Document } from "../types/core/document";
import type { ViewerStyle } from "../types/viewerStyle";
import type { MappingPresentationRule } from "../types/viewer/mappingPresentation";
import { ConversationViewer } from "./ConversationViewer";
import { DeveloperViewer } from "./DeveloperViewer";
import { TextViewer } from "./TextViewer";
import { useViewerTheme } from "./ThemeToggle";
import { ViewerSettings } from "./viewer-options/ViewerSettings";
import type { ViewerId, ViewerOption } from "./viewer-options/viewerSettingsTypes";

type Props = {
  document: Document;
  style?: ViewerStyle;
  mappingPresentationRules?: readonly MappingPresentationRule[];
};

function getViewerOptions(): readonly ViewerOption[] {
  return [
    { id: "conversation", label: "Conversation viewer" },
    { id: "text", label: "Text viewer" },
    { id: "developer", label: "Developer viewer" },
  ];
}

export function ViewerSwitcher({ document, style, mappingPresentationRules }: Props) {
  const viewerOptions = getViewerOptions();
  const [viewerId, setViewerId] = useState<ViewerId>(viewerOptions[0].id);
  const { theme, setTheme } = useViewerTheme();

  const selectedViewer = viewerOptions.find((option) => option.id === viewerId) ?? viewerOptions[0];

  const settingsOwner = {
    theme,
    onThemeChange: setTheme,
    viewerId: selectedViewer.id,
    viewerOptions,
    onViewerChange: setViewerId,
  };

  return (
    <>
      {selectedViewer.id === "developer" ? (
        <DeveloperViewer document={document} style={style} mappingPresentationRules={mappingPresentationRules} {...settingsOwner} />
      ) : selectedViewer.id === "text" ? (
        <>
          <ViewerSettings
            formOptions={[]}
            readingOptions={[]}
            translationLanguageOptions={[]}
            formId=""
            readingFormId={null}
            translationLanguageId="none"
            onFormChange={() => {}}
            onReadingChange={() => {}}
            onTranslationLanguageChange={() => {}}
            autoFollowAvailable={false}
            autoFollowEnabled={false}
            autoFollowMode="unpinned"
            onAutoFollowEnabledChange={() => {}}
            onAutoFollowModeChange={() => {}}
            {...settingsOwner}
          />
          <TextViewer document={document} />
        </>
      ) : (
        <ConversationViewer document={document} style={style} mappingPresentationRules={mappingPresentationRules} {...settingsOwner} />
      )}
    </>
  );
}
