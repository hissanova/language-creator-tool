import { Document } from "@/app/types/core/document";

export const formedTextProvenanceSample = {
  metadata: {
    title: "FormedText and provenance sample",
    defaultLanguageId: "ryu-shuri",
    specVersion: "0.2.0",
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
            selectorRecord: {
              "s-1": {
                selectorType: "range",
                range: { start: 0, end: 3 },
              },
            }
          },
        },
      ],
    },
  ],
} satisfies Document;