import type { Document } from "@/app/types/core/document";

/**
 * Minimal Core JSON fixture for migrating the viewer to app/types/core.
 *
 * Derived from samples/conversation-uch-episode/sample-episode-uchi.lcm,
 * but intentionally reduced to a small smoke test.
 *
 * This sample covers:
 * - conversation metadata
 * - media resource
 * - sections and text blocks
 * - speaker refs
 * - audio alignment refs
 * - whole-line translation
 * - whole-line semantic tag
 * - whole-line note
 * - selector-level gloss mapping
 */
export const viewerConversationSmoke = {
  metadata: {
    specVersion: "0.5-draft",
    title: "Viewer conversation smoke",
    documentType: "conversation",
    defaultLanguageId: "uchi",
    defaultFormId: "surface",
    languages: [
      { id: "uchi", label: "Uchinaaguchi" },
      { id: "ja", label: "Japanese" },
    ],
    forms: [
      { id: "surface", label: "Surface" },
      { id: "gloss", label: "Gloss" },
    ],
    speakers: [
      { id: "chichi", name: "chichi" },
      { id: "saimon", name: "saimon" },
      { id: "masa", name: "masa" },
    ],
  },

  resources: [
    {
      id: "media-uchi-smoke-audio",
      type: "media",
      mediaType: "audio",
      src: "/public/samples/conversation-uch-episode/sample-episode-uchi.mp3",
      label: "Uchinaaguchi sample episode audio",
    },
  ],

  sections: [
    {
      id: "section-uchi-smoke-hajimiabira",
      title: "はじみあびら",
      level: 1,
      blocks: [
        {
          type: "text",
          text: {
            id: "line-uchi-smoke-001",
            content: {
              text: "はじみてぃ しむんどー",
              languageId: "uchi",
              formId: "surface",
            },
            textLineRefs: [
              {
                id: "ref-uchi-smoke-001-speaker",
                body: {
                  type: "speaker",
                  speakerId: "chichi",
                },
              },
              {
                id: "ref-uchi-smoke-001-alignment",
                body: {
                  type: "alignment",
                  mediaRef: {
                    resourceId: "media-uchi-smoke-audio",
                  },
                  interval: {
                    start: 27.66,
                    end: 30.096,
                  },
                },
              },
            ],
            textLineMappings: [
              {
                id: "map-uchi-smoke-001-translation-ja",
                mappingType: "translation",
                image: {
                  id: "line-uchi-smoke-001-translation-ja",
                  content: {
                    text: "はじめていいよ",
                    languageId: "ja",
                    formId: "surface",
                  },
                },
              },
            ],
          },
        },

        {
          type: "text",
          text: {
            id: "line-uchi-smoke-002",
            content: {
              text: "はじま、はじまびら?",
              languageId: "uchi",
              formId: "surface",
            },
            textLineRefs: [
              {
                id: "ref-uchi-smoke-002-speaker",
                body: {
                  type: "speaker",
                  speakerId: "saimon",
                },
              },
              {
                id: "ref-uchi-smoke-002-alignment",
                body: {
                  type: "alignment",
                  mediaRef: {
                    resourceId: "media-uchi-smoke-audio",
                  },
                  interval: {
                    start: 29.963,
                    end: 32.298,
                  },
                },
              },
              {
                id: "ref-uchi-smoke-002-tag-unnatural",
                body: {
                  type: "tag",
                  tags: ["unnatural"],
                },
              },
            ],
          },
        },

        {
          type: "text",
          text: {
            id: "line-uchi-smoke-003",
            content: {
              text: "へーくしゅん！",
              languageId: "uchi",
              formId: "surface",
            },
            textLineRefs: [
              {
                id: "ref-uchi-smoke-003-speaker",
                body: {
                  type: "speaker",
                  speakerId: "masa",
                },
              },
              {
                id: "ref-uchi-smoke-003-alignment",
                body: {
                  type: "alignment",
                  mediaRef: {
                    resourceId: "media-uchi-smoke-audio",
                  },
                  interval: {
                    start: 36.736,
                    end: 38.338,
                  },
                },
              },
              {
                id: "ref-uchi-smoke-003-note",
                body: {
                  type: "note",
                  noteType: "editorial",
                  text: "キッチンで録音していて、サイモンの奥さんがたまに割り込む。",
                },
              },
            ],
          },
        },

        {
          type: "text",
          text: {
            id: "line-uchi-smoke-004",
            content: {
              text: "わんねー にーさんどー",
              languageId: "uchi",
              formId: "surface",
            },
            textLineRefs: [
              {
                id: "ref-uchi-smoke-004-speaker",
                body: {
                  type: "speaker",
                  speakerId: "saimon",
                },
              },
              {
                id: "ref-uchi-smoke-004-alignment",
                body: {
                  type: "alignment",
                  mediaRef: {
                    resourceId: "media-uchi-smoke-audio",
                  },
                  interval: {
                    start: 76.676,
                    end: 78.144,
                  },
                },
              },
            ],
            textLineMappings: [
              {
                id: "map-uchi-smoke-004-translation-ja",
                mappingType: "translation",
                image: {
                  id: "line-uchi-smoke-004-translation-ja",
                  content: {
                    text: "私は遅いよ",
                    languageId: "ja",
                    formId: "surface",
                  },
                },
              },
            ],
            selectorRecord: {
              "selector-uchi-smoke-004-niisandoo": {
                selectorType: "range",
                range: {
                  start: 5,
                  end: 11,
                },
              },
            },
            selectedTextMappings: [
              {
                id: "bundle-uchi-smoke-004-niisandoo-gloss",
                source: "selector-uchi-smoke-004-niisandoo",
                mappings: [
                  {
                    id: "map-uchi-smoke-004-niisandoo-gloss-ja",
                    mappingType: "gloss",
                    image: {
                      id: "line-uchi-smoke-004-niisandoo-gloss-ja",
                      content: {
                        text: "遅いよ",
                        languageId: "ja",
                        formId: "gloss",
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
