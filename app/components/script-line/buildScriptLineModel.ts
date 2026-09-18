import type { Language } from "../../types/core/document";
import type { ScriptLineCompositionProps } from "./types";
import { defaultMappingPresentationRules } from "../../config/mappingPresentationPresets";
import { resolveMappingPresentations } from "./resolveMappingPresentations";
import { resolveAlignedTextLayout } from "./resolveAlignedTextLayout";
import {
  collectResourceRefs,
  collectSelectorAnnotations,
  getAlignmentRef,
  getDisplayMapping,
  getSpeakerRef,
  getTranslations,
  isNonDefaultLanguage,
  lineTags,
  refsToResources,
} from "./coreQueries";

function languageLabel(languageId: string, languages: Language[] | undefined) {
  return languages?.find((language) => language.id === languageId)?.label ?? languageId;
}

type ModelInput = Pick<
  ScriptLineCompositionProps,
  | "textNode"
  | "speakers"
  | "resources"
  | "defaultLanguageId"
  | "languages"
  | "formId"
  | "translationLanguageId"
  | "mappingPresentationRules"
>;

export function buildScriptLineModel({
  textNode,
  speakers,
  resources = [],
  defaultLanguageId,
  languages,
  formId,
  translationLanguageId,
  mappingPresentationRules = defaultMappingPresentationRules,
}: ModelInput) {
  const speakerId = getSpeakerRef(textNode.textLineRefs)?.body.speakerId;
  const displayMapping = getDisplayMapping(textNode, formId);
  const displayText = displayMapping?.image ?? textNode;
  const isLineNonDefaultLanguage = isNonDefaultLanguage(
    displayText.content.languageId,
    defaultLanguageId
  );
  const resourceRefs = collectResourceRefs(textNode.textLineRefs);
  const mappingPresentations = resolveMappingPresentations(textNode, mappingPresentationRules);
  const alignedText = resolveAlignedTextLayout(textNode.content.text, mappingPresentations);
  const presentedWholeLineIds = new Set(
    [...alignedText.wholeLineAbove, ...alignedText.wholeLineBelow].map((item) => item.mappingId),
  );
  const legacyTranslations = getTranslations(textNode, translationLanguageId);

  return {
    textNode,
    speakerId,
    speaker: speakers.find((speaker) => speaker.id === speakerId),
    displayMapping,
    displayText,
    displayTextValue: displayText.content.text,
    originalText: textNode.content.text,
    isLineNonDefaultLanguage,
    lineLanguageLabel: isLineNonDefaultLanguage
      ? languageLabel(displayText.content.languageId, languages)
      : undefined,
    translations: legacyTranslations.filter((mapping) => !presentedWholeLineIds.has(mapping.id)),
    legacyTranslations,
    alignedText,
    alignment: getAlignmentRef(textNode.textLineRefs)?.body.interval,
    textNodeTags: lineTags(textNode),
    annotations: collectSelectorAnnotations(textNode, textNode.content.text),
    resourceRefs,
    nodeResources: refsToResources(resourceRefs, resources),
  };
}

export type ScriptLineModel = ReturnType<typeof buildScriptLineModel>;
