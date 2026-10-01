import type { SelectOption } from "./viewerOptionState";

export type ViewerOptionControlsProps = {
  className?: string;
  formOptions: readonly SelectOption[];
  readingOptions: readonly SelectOption[];
  translationLanguageOptions: readonly SelectOption[];
  formId: string;
  readingFormId: string | null;
  translationLanguageId: string;
  onFormChange: (formId: string) => void;
  onReadingChange: (formId: string | null) => void;
  onTranslationLanguageChange: (languageId: string) => void;
};

export function ViewerOptionControls({
  className = "grid gap-3",
  formOptions,
  readingOptions,
  translationLanguageOptions,
  formId,
  readingFormId,
  translationLanguageId,
  onFormChange,
  onReadingChange,
  onTranslationLanguageChange,
}: ViewerOptionControlsProps) {
  return (
    <div className={className}>
      {formOptions.length > 1 ? (
        <label className="grid gap-1" data-viewer-setting="form">
          <span className="text-sm font-medium">Form</span>
          <select
            className="viewer-interactive-surface rounded border px-2 py-1"
            value={formId}
            onChange={(event) => onFormChange(event.target.value)}
          >
            {formOptions.map((form) => (
              <option key={form.id} value={form.id}>
                {form.label ?? form.id}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      {readingOptions.length > 0 ? (
        <label className="grid gap-1" data-viewer-setting="reading">
          <span className="text-sm font-medium">Reading</span>
          <select
            className="viewer-interactive-surface rounded border px-2 py-1"
            value={readingFormId ?? ""}
            onChange={(event) => onReadingChange(event.target.value || null)}
          >
            <option value="">None</option>
            {readingOptions.map((form) => (
              <option key={form.id} value={form.id}>
                {form.label ?? form.id}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      {translationLanguageOptions.length > 0 ? (
        <label className="grid gap-1" data-viewer-setting="translation">
          <span className="text-sm font-medium">Translation</span>
          <select
            className="viewer-interactive-surface rounded border px-2 py-1"
            value={translationLanguageId}
            onChange={(event) => onTranslationLanguageChange(event.target.value)}
          >
            {translationLanguageOptions.map((language) => (
              <option key={language.id} value={language.id}>
                {language.label ?? language.id}
              </option>
            ))}
          </select>
        </label>
      ) : null}
    </div>
  );
}
