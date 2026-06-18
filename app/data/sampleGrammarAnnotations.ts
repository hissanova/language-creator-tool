import type { Document } from "../types/lcm";

export const sampleDocument = {
  metadata: {
    specVersion: "0.4-alpha",
    title: "Okinawan Example",
    documentType: "text",
    defaultLanguageId: "uch",
    defaultFormId: "surface",
    languages: [
      { id: "ja", label: "日本語" },
      { id: "en", label: "English" },
    ],
    forms: [
      { id: "surface", label: "Surface" },
      { id: "kana", label: "かな" },
      { id: "phoneme", label: "音素" },
      { id: "ipa", label: "IPA" },
    ],
    speakers: [{ id: "kanaa", name: "例文" }],
  },
  resources: [
    {
      id: "uch-local",
      type: "external",
      resourceType: "dictionary",
      title: "Local Okinawan dictionary",
      uri: "/dictionaries/uch.json",
    },
  ],
  sections: [
    {
      id: "section-1",
      title: "テーン形の例",
      level: 1,
      time: { start: 0 },
      blocks: [
        {
          type: "text",
          text: {
            id: "line-1",
            content: {
              text: "雨ぬ降とーん。",
              languageId: "uch",
              formId: "surface",
            },
            refs: [
              {
                id: "line-1-speaker",
                body: { type: "speaker", speakerId: "kanaa" },
              },
            ],
            transforms: [
              {
                id: "line-1-ja",
                transformType: "translation",
                output: {
                  id: "line-1-ja-output",
                  content: {
                    text: "雨が降っている。",
                    languageId: "ja",
                    formId: "surface",
                  },
                },
              },
              {
                id: "line-1-kana",
                transformType: "form",
                output: {
                  id: "line-1-kana-output",
                  content: {
                    text: "あみぬふとーん。",
                    languageId: "uch",
                    formId: "kana",
                  },
                },
              },
            ],
            selectors: [
              {
                id: "selector-ami",
                selectorType: "morphology",
                children: [
                  {
                    id: "selector-ami-child",
                    content: {
                      text: "雨",
                      languageId: "uch",
                      formId: "surface",
                    },
                    source: {
                      type: "selector",
                      ranges: [{ start: 0, end: 1 }],
                    },
                    transforms: [
                      {
                        id: "selector-ami-phoneme",
                        transformType: "form",
                        output: {
                          id: "selector-ami-phoneme-output",
                          content: {
                            text: "ami",
                            languageId: "uch",
                            formId: "phoneme",
                          },
                        },
                      },
                    ],
                  },
                ],
                refs: [
                  {
                    id: "selector-ami-dictionary",
                    body: {
                      type: "dictionary",
                      ref: { resourceId: "uch-local" },
                      definitions: {
                        ja: "雨",
                        en: "rain",
                      },
                    },
                  },
                ],
              },
            ],
          },
        },
      ],
    },
  ],
} satisfies Document;
