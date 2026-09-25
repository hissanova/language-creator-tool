"use client";

import { useEffect, useMemo, useReducer } from "react";
import type { Document } from "../../types/core/document";
import {
  createInitialViewerOptionSelections,
  reconcileViewerOptionSelections,
  viewerOptionReducer,
  type ViewerOptionAction,
  type ViewerOptionAvailability,
  type ViewerOptionSelections,
} from "./viewerOptionState";

type LifecycleState = {
  documentToken: symbol;
  selections: ViewerOptionSelections;
};

type LifecycleAction =
  | ViewerOptionAction
  | {
      type: "commit-document";
      documentToken: symbol;
      availability: ViewerOptionAvailability;
      defaultFormId?: string;
    };

function lifecycleReducer(state: LifecycleState, action: LifecycleAction): LifecycleState {
  if (action.type === "commit-document") {
    return {
      documentToken: action.documentToken,
      selections: viewerOptionReducer(state.selections, {
        type: "document-changed",
        availability: action.availability,
        defaultFormId: action.defaultFormId,
      }),
    };
  }
  return { ...state, selections: viewerOptionReducer(state.selections, action) };
}

export function useViewerOptionSelections(
  document: Document,
  availability: ViewerOptionAvailability,
) {
  const documentToken = useMemo(() => Symbol(document.metadata.title), [document]);
  const defaultFormId = document.metadata.defaultFormId;
  const [state, dispatch] = useReducer(
    lifecycleReducer,
    undefined,
    (): LifecycleState => ({
      documentToken,
      selections: createInitialViewerOptionSelections(availability, defaultFormId),
    }),
  );
  const documentChanged = state.documentToken !== documentToken;
  const selections = reconcileViewerOptionSelections(
    state.selections,
    availability,
    defaultFormId,
    documentChanged,
  );

  useEffect(() => {
    if (!documentChanged) return;
    dispatch({
      type: "commit-document",
      documentToken,
      availability,
      defaultFormId,
    });
  }, [availability, defaultFormId, documentChanged, documentToken]);

  return {
    selections,
    selectForm: (formId: string) => dispatch({
      type: "select-form",
      formId,
      options: availability.formOptions,
    }),
    selectReading: (readingFormId: string | null) => dispatch({
      type: "select-reading",
      readingFormId,
      options: availability.readingOptions,
    }),
    selectTranslationLanguage: (languageId: string) => dispatch({
      type: "select-translation",
      languageId,
      options: availability.translationLanguageOptions,
    }),
  };
}
