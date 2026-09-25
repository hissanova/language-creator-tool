export type SelectOption = { id: string; label?: string };

export type ViewerOptionSelections = {
  formId: string;
  readingFormId: string | null;
  translationLanguageId: string;
};

export type ViewerOptionAvailability = {
  formOptions: readonly SelectOption[];
  readingOptions: readonly SelectOption[];
  translationLanguageOptions: readonly SelectOption[];
};

export type ViewerOptionAction =
  | { type: "select-form"; formId: string; options: readonly SelectOption[] }
  | { type: "select-reading"; readingFormId: string | null; options: readonly SelectOption[] }
  | { type: "select-translation"; languageId: string; options: readonly SelectOption[] }
  | {
      type: "document-changed";
      availability: ViewerOptionAvailability;
      defaultFormId?: string;
    };

function includesOption(options: readonly SelectOption[], id: string) {
  return options.some((option) => option.id === id);
}

function initialFormId(
  formOptions: readonly SelectOption[],
  defaultFormId?: string,
) {
  return defaultFormId && includesOption(formOptions, defaultFormId)
    ? defaultFormId
    : formOptions[0]?.id ?? "none";
}

export function createInitialViewerOptionSelections(
  availability: ViewerOptionAvailability,
  defaultFormId?: string,
): ViewerOptionSelections {
  return {
    formId: initialFormId(availability.formOptions, defaultFormId),
    readingFormId: null,
    translationLanguageId: "none",
  };
}

export function reconcileViewerOptionSelections(
  current: ViewerOptionSelections,
  availability: ViewerOptionAvailability,
  defaultFormId: string | undefined,
  documentChanged: boolean,
): ViewerOptionSelections {
  const initial = createInitialViewerOptionSelections(availability, defaultFormId);
  return {
    formId: includesOption(availability.formOptions, current.formId)
      ? current.formId
      : initial.formId,
    readingFormId: !documentChanged && current.readingFormId !== null &&
      includesOption(availability.readingOptions, current.readingFormId)
      ? current.readingFormId
      : null,
    translationLanguageId: includesOption(
      availability.translationLanguageOptions,
      current.translationLanguageId,
    )
      ? current.translationLanguageId
      : initial.translationLanguageId,
  };
}

export function viewerOptionReducer(
  state: ViewerOptionSelections,
  action: ViewerOptionAction,
): ViewerOptionSelections {
  switch (action.type) {
    case "select-form":
      return includesOption(action.options, action.formId)
        ? { ...state, formId: action.formId }
        : state;
    case "select-reading":
      return action.readingFormId === null || includesOption(action.options, action.readingFormId)
        ? { ...state, readingFormId: action.readingFormId }
        : state;
    case "select-translation":
      return includesOption(action.options, action.languageId)
        ? { ...state, translationLanguageId: action.languageId }
        : state;
    case "document-changed":
      return reconcileViewerOptionSelections(
        state,
        action.availability,
        action.defaultFormId,
        true,
      );
  }
}
