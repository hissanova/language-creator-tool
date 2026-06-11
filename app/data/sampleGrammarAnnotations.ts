import type { Document } from "../types/lcm";

export const sampleDocument: Document = {
  metadata: {
    title: "Okinawan Example",
    documentType: "example-collection",
    targetLanguage: "uch",
    translationLanguages: [
      { id: "ja", label: "日本語" },
      { id: "en", label: "English" },
    ],
    formTypes: [
      { id: "kana", label: "かな" },
      { id: "phoneme", label: "音素" },
      { id: "ipa", label: "IPA" },
    ],
    speakers: [{ id: "kanaa", name: "例文" }],
    dictionarySources: [
      {
        id: "uch-local",
        type: "json",
        path: "/dictionaries/uch.json",
      },
    ],
    media: null,
    specVersion: "0.3-alpha",
  },

  body: [
    {
      id: "section-1",
      title: "テーン形の例",
      level: 1,
      time: { start: 0 },
      lines: [
        {
          id: "line-1",
          speakerId: "kanaa",
          text: {
            text: "雨ぬ降とーん。",
          },
          targets: [
            {
              id: "target-line-1",
              kind: "line",
              lineId: "line-1",
              annotations: [
                {
                  type: "translation",
                  language: "ja",
                  text: "雨が降っている。",
                },
                {
                  type: "form",
                  formType: "kana",
                  value: {
                    text: "あみぬふとーん。",
                    decomposition: {
                      units: [
                        {
                          id: "unit-ami",
                          text: { text: "あみ" },
                          targets: [
                            {
                              id: "target-ami",
                              kind: "textSpan",
                              text: "あみ",
                              annotations: [
                                {
                                  type: "dictionary",
                                  ref: "dict:uch:ami#sense-1",
                                  meanings: {
                                    ja: "雨",
                                    en: "rain",
                                  },
                                },
                              ],
                            },
                          ],
                        },
                        {
                          id: "unit-nu",
                          text: { text: "ぬ" },
                          targets: [
                            {
                              id: "target-nu",
                              kind: "textSpan",
                              text: "ぬ",
                              annotations: [
                                {
                                  type: "dictionary",
                                  headword: "ぬ",
                                  pos: "particle",
                                  meanings: {
                                    ja: "主格・属格などを表す助詞",
                                  },
                                },
                              ],
                            },
                          ],
                        },
                        {
                          id: "unit-hutoon",
                          text: {
                            text: "ふとーん",
                          },
                          targets: [
                            {
                              id: "target-hutoon",
                              kind: "textSpan",
                              text: "ふとーん",
                              annotations: [
                                {
                                  type: "form",
                                  formType: "phoneme",
                                  value: {
                                    text: "hutooN",
                                    decomposition: {
                                      units: [
                                        {
                                          id: "unit-hut",
                                          text: { text: "hut" },
                                          targets: [
                                            {
                                              id: "target-hut",
                                              kind: "textSpan",
                                              text: "hut",
                                              annotations: [
                                                {
                                                  type: "dictionary",
                                                  ref: "dict:uch:furu#stem",
                                                  meanings: {
                                                    ja: "降るのティ形語幹",
                                                  },
                                                },
                                              ],
                                            },
                                          ],
                                        },
                                        {
                                          id: "unit-oon",
                                          text: { text: "ooN" },
                                          targets: [
                                            {
                                              id: "target-oon",
                                              kind: "textSpan",
                                              text: "ooN",
                                              annotations: [
                                                {
                                                  type: "dictionary",
                                                  headword: "ooN",
                                                  pos: "aspect marker",
                                                  meanings: {
                                                    ja: "結果状態・継続を表す",
                                                  },
                                                  tags: ["teen-form", "aspect"],
                                                },
                                                {
                                                  type: "tag",
                                                  tags: ["teen-form", "aspect"],
                                                },
                                              ],
                                            },
                                          ],
                                        },
                                      ],
                                    },
                                  },
                                },
                              ],
                            },
                          ],
                        },
                      ],
                    },
                  },
                },
              ],
            },
            {
              id: "target-line-1-ami",
              kind: "textSpan",
              text: "雨",
              annotations: [
                {
                  type: "form",
                  formType: "phoneme",
                  value: {
                    text: "ami",
                  },
                },
              ]
            }
          ],
        },
      ],
    },
  ],
};  