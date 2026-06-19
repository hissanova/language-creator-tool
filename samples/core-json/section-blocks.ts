import type { Document } from "@/app/types/lcm";

export const sectionBlocksExample = {
  metadata: {
    title: "Section Blocks Example",
    defaultLanguageId: "uch",
    languages: [
      { id: "uch", label: "沖縄語" },
      { id: "ja", label: "日本語" },
    ],
    specVersion: "0.1.0",
  },
  sections: [
    {
      id: "section-1",
      title: "Greeting",
      level: 1,
      blocks: [
        {
          type: "text",
          text: {
            id: "line-1",
            content: {
              languageId: "uch",
              formId: "surface",
              text: "はいさい。",
            },
          },
        },
        {
          type: "note",
          note: {
            id: "note-1",
            title: "沖縄語の挨拶に関して",
            text: "沖縄語の首里・那覇方言では、男性は「はいさい」、女性は「はいたい」という習慣がある。",
          },
        },
        {
          type: "text",
          text: {
            id: "line-2",
            content: {
              languageId: "uch",
              formId: "surface",
              text: "ちゃーがんじゅーやみ？",
            },
          },
        },
      ],
    },
  ],
} satisfies Document;
