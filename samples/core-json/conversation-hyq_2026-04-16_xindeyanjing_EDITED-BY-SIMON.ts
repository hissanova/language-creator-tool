import type { Document } from "../../app/types/lcm";

export const conversation: Document = {
  metadata: {
    title: "新的眼睛",
    documentType: "conversation",
    targetLanguage: "zh-Hant",
    translationLanguages: [
      { id: "zh-Hant", label: "繁體中文" },
      { id: "en", label: "English" }
    ],
    speakers: [
      { id: "simon", name: "Simon" },
      { id: "lan", name: "Lan" }
    ],
    media: {
      src: "@/public/sample-media/conversation-hyq_2026-04-16_xindeyanjing_EDITED-BY-SIMON.mp3",
      type: "audio"
    },
    specVersion: "0.3-alpha"
  },
  body: [
    {
      id: "section-0001",
      title: "INTRO 新的眼睛",
      level: 1,
      time: { start: 0 },
      blocks: []
    },
    {
      id: "section-0002",
      title: "新的眼睛",
      level: 2,
      time: { start: 69.5 },
      blocks: [
        {
          type: "line",
          line: {
            id: "line-0001",
            speakerId: "simon",
            time: { start: 70, end: 71 },
            text: {
              formType: "surface",
              text: "哈羅"
            }
          }
        },
        {
          type: "line",
          line: {
            id: "line-0002",
            speakerId: "lan",
            time: { start: 71, end: 72 },
            text: {
              formType: "surface",
              text: "哈羅"
            }
          }
        },
        {
          type: "line",
          line: {
            id: "line-0003",
            speakerId: "simon",
            time: { start: 72, end: 78 },
            text: {
              formType: "surface",
              text: "你聽得到嗎?"
            }
          }
        },
        {
          type: "line",
          line: {
            id: "line-0004",
            speakerId: "lan",
            time: { start: 78, end: 80 },
            text: {
              formType: "surface",
              text: "聽得到。"
            }
          }
        },
        {
          type: "line",
          line: {
            id: "line-0005",
            speakerId: "simon",
            time: { start: 80, end: 82 },
            text: {
              formType: "surface",
              text: "你看得到嗎?"
            }
          }
        },
        {
          type: "line",
          line: {
            id: "line-0006",
            speakerId: "lan",
            time: { start: 82, end: 84 },
            text: {
              formType: "surface",
              text: "看得到😅。"
            }
          }
        },
        {
          type: "line",
          line: {
            id: "line-0007",
            speakerId: "simon",
            time: { start: 84, end: 86 },
            text: {
              formType: "surface",
              text: "聽我?"
            },
            targets: [
              {
                id: "target-0001",
                kind: "textSpan",
                selector: {
                  type: "text",
                  text: "聽我",
                  occurrence: 1
                },
                annotations: [
                  {
                    type: "tag",
                    tags: ["unnatural"]
                  }
                ]
              }
            ]
          }
        },
        {
          type: "line",
          line: {
            id: "line-0008",
            speakerId: "lan",
            time: { start: 86, end: 88 },
            text: {
              formType: "surface",
              text: "聽你說是不是?"
            }
          }
        },
        {
          type: "line", 
          line: {
            id: "line-0009",
            speakerId: "simon",
            time: { start: 88, end: 90 },
            text: { formType: "surface", text: "聽我?你看得到嗎?" },
            targets: [
              {
                id: "target-0002",
                kind: "textSpan",
                selector: {
                  type: "text",
                  text: "聽我",
                  occurrence: 1
                },
                annotations: [
                  {
                    type: "tag",
                    tags: ["unnatural"]
                  }
                ]
              }
            ]
          }
        },
        {
          type: "line",
          line: {
            id: "line-0010",
            speakerId: "lan",
            time: { start: 90, end: 92 },
            text: { formType: "surface", text: "問你。" }
          }
        },
        {
          type: "line",
          line: {
            id: "line-0011",
            speakerId: "simon",
            time: { start: 92, end: 94 },
            text: { formType: "surface", text: "問你。啊！！" }
          }
        },
        {
          type: "line",
          line: {
            id: "line-0012",
            speakerId: "simon",
            time: { start: 94, end: 96 },
            text: { formType: "surface", text: "問と...." }
          }
        },
        {
          type: "line",
          line: {
            id: "line-0013",
            speakerId: "simon",
            time: { start: 96, end: 98 },
            text: { formType: "surface", text: "日本人の皆さん！" },
            targets: [
              {
                id: "target-0003",
                kind: "textSpan",
                selector: {
                  type: "text",
                  text: "日本人の皆さん",
                  occurrence: 1
                },
                annotations: [
                  {
                    type: "translation",
                    language: "zh-Hant",
                    value: {
                      formType: "surface",
                      text: "大家日本人"
                    }
                  },
                  {
                    type: "translation",
                    language: "en",
                    value: {
                      formType: "surface",
                      text: "Japanese people!"
                    }
                  }
                ]
              }
            ]
          }
        }
      ]
    }
  ]
} satisfies Document;