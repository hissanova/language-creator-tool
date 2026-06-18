import type { Document } from "../types/lcm";

export const sampleDocument = {
  metadata: {
    specVersion: "0.4-alpha",
    title: "Chinese Conversation 01",
    documentType: "conversation",
    defaultLanguageId: "zh-Hans",
    defaultFormId: "surface",
    languages: [
      { id: "en", label: "English" },
      { id: "ja", label: "日本語" },
    ],
    forms: [
      { id: "surface", label: "Surface" },
      { id: "pinyin", label: "Pinyin" },
      { id: "zhuyin", label: "Bopomofo" },
    ],
    speakers: [
      { id: "speaker-a", name: "A" },
      { id: "speaker-b", name: "B" },
    ],
  },
  resources: [
    {
      id: "sample-audio",
      type: "media",
      mediaType: "audio",
      src: "/media/audio/hyq_2026-05-24_nuerququle.mp3",
    },
  ],
  sections: [
    {
      id: "section-1",
      title: "Greeting",
      level: 1,
      time: { start: 0, end: 8 },
      blocks: [
        {
          type: "text",
          text: {
            id: "line-1",
            content: {
              text: "你好，我正在学习中文。",
              languageId: "zh-Hans",
              formId: "surface",
            },
            refs: [
              {
                id: "line-1-speaker",
                body: { type: "speaker", speakerId: "speaker-a" },
              },
              {
                id: "line-1-alignment",
                body: {
                  type: "alignment",
                  mediaRef: { resourceId: "sample-audio" },
                  interval: { start: 0, end: 8 },
                },
              },
            ],
            transforms: [
              {
                id: "line-1-traditional",
                transformType: "form",
                output: {
                  id: "line-1-traditional-output",
                  content: {
                    text: "你好，我正在學習中文。",
                    languageId: "zh-Hant",
                    formId: "surface",
                  },
                },
              },
              {
                id: "line-1-en",
                transformType: "translation",
                output: {
                  id: "line-1-en-output",
                  content: {
                    text: "Hello, I am studying Chinese.",
                    languageId: "en",
                    formId: "surface",
                  },
                },
              },
            ],
            selectors: [
              {
                id: "line-1-nihao",
                selectorType: "span",
                children: [
                  {
                    id: "line-1-nihao-text",
                    content: {
                      text: "你好",
                      languageId: "zh-Hans",
                      formId: "surface",
                    },
                    source: {
                      type: "selector",
                      ranges: [{ start: 0, end: 2 }],
                    },
                    transforms: [
                      {
                        id: "line-1-nihao-pinyin",
                        transformType: "form",
                        output: {
                          id: "line-1-nihao-pinyin-output",
                          content: {
                            text: "nǐ hǎo",
                            languageId: "zh-Hans",
                            formId: "pinyin",
                          },
                        },
                      },
                    ],
                  },
                ],
                refs: [
                  {
                    id: "line-1-nihao-dictionary",
                    body: {
                      type: "dictionary",
                      headword: "你好",
                      definitions: {
                        en: ["hello"],
                        ja: ["こんにちは"],
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
