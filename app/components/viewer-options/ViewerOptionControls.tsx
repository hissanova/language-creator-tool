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
  className,
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
        <label className="flex items-center gap-2">
          <span className="text-sm font-medium">Form</span>
          <select
            className="rounded border bg-white px-2 py-1 text-gray-950"
            value={formId}
            onChange={(event) => onFormChange(event.target.value)}
          >
            {formOptions.map((form) => (
              <option key={form.id} value={form.id} className="bg-white text-gray-950">
                {form.label ?? form.id}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      {readingOptions.length > 0 ? (
        <label className="flex items-center gap-2">
          <span className="text-sm font-medium">Reading</span>
          <select
            className="rounded border bg-white px-2 py-1 text-gray-950"
            value={readingFormId ?? ""}
            onChange={(event) => onReadingChange(event.target.value || null)}
          >
            <option value="" className="bg-white text-gray-950">None</option>
            {readingOptions.map((form) => (
              <option key={form.id} value={form.id} className="bg-white text-gray-950">
                {form.label ?? form.id}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      <label className="flex items-center gap-2">
        <span className="text-sm font-medium">Translation</span>
        <select
          className="rounded border bg-white px-2 py-1 text-gray-950"
          value={translationLanguageId}
          onChange={(event) => onTranslationLanguageChange(event.target.value)}
        >
          {translationLanguageOptions.map((language) => (
            <option key={language.id} value={language.id} className="bg-white text-gray-950">
              {language.label ?? language.id}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
