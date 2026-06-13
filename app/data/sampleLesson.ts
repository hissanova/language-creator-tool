import type { Document } from "../types/viewer";

export const sampleLesson: Document = {
  title: "Chinese Conversation 01",
  audio: "/audio/sample.mp3",

  textVariants: [
    { id: "zh-Hans", label: "简体" },
    { id: "zh-Hant", label: "繁體" },
  ],

  rubyTypes: [
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
  defaultRubyTypeId: "pinyin",
  defaultTranslationLanguageId: "en",

  speakers: [
    { id: "speaker-a", name: "A", color: "blue" },
    { id: "speaker-b", name: "B", color: "green" },
  ],

  sections: [
    {
      id: "chapter-1",
      title: "Greeting",
      startTime: 0,
      endTime: 8,
      lines: [
        {
          id: "line-1",
          speakerId: "speaker-a",
          texts: {
            "zh-Hans": "你好，我正在学习中文。",
            "zh-Hant": "你好，我正在學習中文。",
          },
          translations: {
            en: "Hello, I am studying Chinese.",
            ja: "こんにちは。私は中国語を勉強しています。",
          },
          annotations: [
            {
              id: "a1",
              type: "word",
              start: 0,
              end: 2,
              ruby: {
                pinyin: "nǐ hǎo",
                zhuyin: "ㄋㄧˇ ㄏㄠˇ",
              },
              meanings: {
                en: "hello",
                ja: "こんにちは",
              },
            },
            {
              id: "a2",
              type: "word",
              start: 3,
              end: 4,
              ruby: {
                pinyin: "wǒ",
                zhuyin: "ㄨㄛˇ",
              },
              meanings: {
                en: "I / me",
                ja: "私",
              },
            },
            {
              id: "a3",
              type: "phrase",
              start: 4,
              end: 6,
              ruby: {
                pinyin: "zhèngzài",
                zhuyin: "ㄓㄥˋ ㄗㄞˋ",
              },
              meanings: {
                en: "be currently doing",
                ja: "ちょうど〜している",
              },
            },
            {
              id: "a4",
              type: "word",
              start: 6,
              end: 8,
              ruby: {
                pinyin: "xuéxí",
                zhuyin: "ㄒㄩㄝˊ ㄒㄧˊ",
              },
              meanings: {
                en: "to study",
                ja: "勉強する",
              },
            },
            {
              id: "a5",
              type: "word",
              start: 8,
              end: 10,
              ruby: {
                pinyin: "zhōngwén",
                zhuyin: "ㄓㄨㄥ ㄨㄣˊ",
              },
              meanings: {
                en: "Chinese language",
                ja: "中国語",
              },
            },
          ],
        },
      ],
    },
    {
      id: "chapter-2",
      title: "Follow-up question",
      startTime: 8,
      endTime: 16,
      lines: [
        {
          id: "line-2",
          speakerId: "speaker-b",
          texts: {
            "zh-Hans": "很好！你学习多久了？",
            "zh-Hant": "很好！你學習多久了？",
          },
          translations: {
            en: "Great! How long have you been studying?",
            ja: "いいですね！どのくらい勉強しているんですか？",
          },
          annotations: [
            {
              id: "b1",
              type: "word",
              start: 0,
              end: 2,
              ruby: {
                pinyin: "hěn hǎo",
                zhuyin: "ㄏㄣˇ ㄏㄠˇ",
              },
              meanings: {
                en: "very good",
                ja: "とても良い",
              },
            },
            {
              id: "b2",
              type: "word",
              start: 3,
              end: 4,
              ruby: {
                pinyin: "nǐ",
                zhuyin: "ㄋㄧˇ",
              },
              meanings: {
                en: "you",
                ja: "あなた",
              },
            },
            {
              id: "b3",
              type: "word",
              start: 4,
              end: 6,
              ruby: {
                pinyin: "xuéxí",
                zhuyin: "ㄒㄩㄝˊ ㄒㄧˊ",
              },
              meanings: {
                en: "to study",
                ja: "勉強する",
              },
            },
            {
              id: "b4",
              type: "phrase",
              start: 6,
              end: 8,
              ruby: {
                pinyin: "duō jiǔ",
                zhuyin: "ㄉㄨㄛ ㄐㄧㄡˇ",
              },
              meanings: {
                en: "how long",
                ja: "どのくらい",
              },
            },
            {
              id: "b5",
              type: "word",
              start: 8,
              end: 9,
              ruby: {
                pinyin: "le",
                zhuyin: "ㄌㄜ˙",
              },
              meanings: {
                en: "particle indicating change/completion",
                ja: "変化・完了を表す助詞",
              },
            },
          ],
        },
      ],
    },
  ],
};