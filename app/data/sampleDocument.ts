import type { Document } from "../types/lcm";

export const sampleDocument: Document = {
  metadata: {
    title: "Chinese Conversation 01",
    documentType: "conversation",
    targetLanguage: "zh-Hans",
    media: {
      src: "/media/audio/hyq_2026-05-24_nuerququle.mp3",
      type: "audio",
    },

    textVariants: [
      { id: "zh-Hans", label: "简体" },
      { id: "zh-Hant", label: "繁體" },
    ],

    formTypes: [
      { id: "none", label: "Off" },
      { id: "pinyin", label: "Pinyin" },
      { id: "zhuyin", label: "Bopomofo" },
    ],

    translationLanguages: [
      { id: "none", label: "Off" },
      { id: "en", label: "English" },
      { id: "ja", label: "日本語" },
    ],

    defaultTextVariantId: "zh-Hans",
    defaultFormTypeId: "pinyin",
    defaultTranslationLanguageId: "en",

    speakers: [
      { id: "speaker-a", name: "A", color: "blue" },
      { id: "speaker-b", name: "B", color: "green" },
    ],

    specVersion: "0.3-alpha",
  },

  body: [
    {
      id: "section-1",
      title: "Greeting",
      level: 1,
      time: { start: 0, end: 8 },
      blocks: [
        {
          "type": "line",
          "line":
          {
            id: "line-1",
            speakerId: "speaker-a",
            time: { start: 0, end: 8 },
            text: {
              text: "你好，我正在学习中文。",
            },
            targets: [
              {
                id: "line-1-target-line",
                kind: "line",
                lineId: "line-1",
                annotations: [
                  {
                    type: "form",
                    formType: "zh-Hant",
                    value: { text: "你好，我正在學習中文。" },
                  },
                  {
                    type: "translation",
                    language: "en",
                    text: "Hello, I am studying Chinese.",
                  },
                  {
                    type: "translation",
                    language: "ja",
                    text: "こんにちは。私は中国語を勉強しています。",
                  },
                ],
              },
              {
                id: "a1",
                kind: "textSpan",
                text: "你好",
                range: { start: 0, end: 2 },
                annotations: [
                  {
                    type: "form",
                    formType: "pinyin",
                    value: { text: "nǐ hǎo" },
                  },
                  {
                    type: "form",
                    formType: "zhuyin",
                    value: { text: "ㄋㄧˇ ㄏㄠˇ" },
                  },
                  {
                    type: "dictionary",
                    headword: "你好",
                    meanings: {
                      en: ["hello"],
                      ja: ["こんにちは"],
                    },
                  },
                ],
              },
              {
                id: "a2",
                kind: "textSpan",
                text: "我",
                range: { start: 3, end: 4 },
                annotations: [
                  {
                    type: "form",
                    formType: "pinyin",
                    value: { text: "wǒ" },
                  },
                  {
                    type: "form",
                    formType: "zhuyin",
                    value: { text: "ㄨㄛˇ" },
                  },
                  {
                    type: "dictionary",
                    headword: "我",
                    meanings: {
                      en: ["I / me"],
                      ja: ["私"],
                    },
                  },
                ],
              },
              {
                id: "a3",
                kind: "textSpan",
                text: "正在",
                range: { start: 4, end: 6 },
                annotations: [
                  {
                    type: "form",
                    formType: "pinyin",
                    value: { text: "zhèngzài" },
                  },
                  {
                    type: "form",
                    formType: "zhuyin",
                    value: { text: "ㄓㄥˋ ㄗㄞˋ" },
                  },
                  {
                    type: "dictionary",
                    headword: "正在",
                    pos: "phrase",
                    meanings: {
                      en: ["be currently doing"],
                      ja: ["ちょうど〜している"],
                    },
                  },
                ],
              },
              {
                id: "a4",
                kind: "textSpan",
                text: "学习",
                range: { start: 6, end: 8 },
                annotations: [
                  {
                    type: "form",
                    formType: "pinyin",
                    value: { text: "xuéxí" },
                  },
                  {
                    type: "form",
                    formType: "zhuyin",
                    value: { text: "ㄒㄩㄝˊ ㄒㄧˊ" },
                  },
                  {
                    type: "dictionary",
                    headword: "学习",
                    meanings: {
                      en: ["to study"],
                      ja: ["勉強する"],
                    },
                  },
                ],
              },
              {
                id: "a5",
                kind: "textSpan",
                text: "中文",
                range: { start: 8, end: 10 },
                annotations: [
                  {
                    type: "form",
                    formType: "pinyin",
                    value: { text: "zhōngwén" },
                  },
                  {
                    type: "form",
                    formType: "zhuyin",
                    value: { text: "ㄓㄨㄥ ㄨㄣˊ" },
                  },
                  {
                    type: "dictionary",
                    headword: "中文",
                    meanings: {
                      en: ["Chinese language"],
                      ja: ["中国語"],
                    },
                  },
                ],
              },
            ],
          }
        },
      ],
    },
    {
      id: "section-2",
      title: "Follow-up question",
      level: 1,
      time: { start: 8, end: 16 },
      blocks: [
        {
          "type": "line",
          "line":
          {
            id: "line-2",
            speakerId: "speaker-b",
            time: { start: 8, end: 16 },
            text: {
              text: "很好！你学习多久了？",
            },
            targets: [
              {
                id: "line-2-target-line",
                kind: "line",
                lineId: "line-2",
                annotations: [
                  {
                    type: "form",
                    formType: "zh-Hant",
                    value: { text: "很好！你學習多久了？" },
                  },
                  {
                    type: "translation",
                    language: "en",
                    text: "Great! How long have you been studying?",
                  },
                  {
                    type: "translation",
                    language: "ja",
                    text: "いいですね！どのくらい勉強しているんですか？",
                  },
                ],
              },
              {
                id: "b1",
                kind: "textSpan",
                text: "很好",
                range: { start: 0, end: 2 },
                annotations: [
                  { type: "form", formType: "pinyin", value: { text: "hěn hǎo" } },
                  { type: "form", formType: "zhuyin", value: { text: "ㄏㄣˇ ㄏㄠˇ" } },
                  {
                    type: "dictionary",
                    headword: "很好",
                    meanings: { en: ["very good"], ja: ["とても良い"] },
                  },
                ],
              },
              {
                id: "b2",
                kind: "textSpan",
                text: "你",
                range: { start: 3, end: 4 },
                annotations: [
                  { type: "form", formType: "pinyin", value: { text: "nǐ" } },
                  { type: "form", formType: "zhuyin", value: { text: "ㄋㄧˇ" } },
                  {
                    type: "dictionary",
                    headword: "你",
                    meanings: { en: ["you"], ja: ["あなた"] },
                  },
                ],
              },
              {
                id: "b3",
                kind: "textSpan",
                text: "学习",
                range: { start: 4, end: 6 },
                annotations: [
                  { type: "form", formType: "pinyin", value: { text: "xuéxí" } },
                  { type: "form", formType: "zhuyin", value: { text: "ㄒㄩㄝˊ ㄒㄧˊ" } },
                  {
                    type: "dictionary",
                    headword: "学习",
                    meanings: { en: ["to study"], ja: ["勉強する"] },
                  },
                ],
              },
              {
                id: "b4",
                kind: "textSpan",
                text: "多久",
                range: { start: 6, end: 8 },
                annotations: [
                  { type: "form", formType: "pinyin", value: { text: "duō jiǔ" } },
                  { type: "form", formType: "zhuyin", value: { text: "ㄉㄨㄛ ㄐㄧㄡˇ" } },
                  {
                    type: "dictionary",
                    headword: "多久",
                    pos: "phrase",
                    meanings: { en: ["how long"], ja: ["どのくらい"] },
                  },
                ],
              },
              {
                id: "b5",
                kind: "textSpan",
                text: "了",
                range: { start: 8, end: 9 },
                annotations: [
                  { type: "form", formType: "pinyin", value: { text: "le" } },
                  { type: "form", formType: "zhuyin", value: { text: "ㄌㄜ˙" } },
                  {
                    type: "dictionary",
                    headword: "了",
                    meanings: {
                      en: ["particle indicating change/completion"],
                      ja: ["変化・完了を表す助詞"],
                    },
                  },
                ],
              },
            ],
          }
        },
      ],
    },
  ],
};
