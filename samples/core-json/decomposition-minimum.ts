import type { Document } from "@/app/types/core/document";

export const sample = {
    metadata: {
        specVersion: "0.5-draft",
        title: "喫到飽 sample",
        documentType: "text",
        defaultLanguageId: "zh-Hant",
        defaultFormId: "surface",
        languages: [
            { id: "zh-Hant", label: "Traditional Chinese" },
            { id: "en", label: "English" }
        ],
        forms: [
            { id: "surface", label: "Surface" },
            { id: "gloss", label: "Gloss" }
        ]
    },
    sections: [
        {
            id: "sec-1",
            title: "喫到飽",
            level: 1,
            blocks: [
                {
                    type: "text",
                    text: {
                        id: "line-1",
                        content: {
                            text: "喫到飽",
                            languageId: "zh-Hant",
                            formId: "surface"
                        },
                        selectorRecord: {
                            "s-chi": {
                                selectorType: "range",
                                range: { start: 0, end: 1 }
                            },
                            "s-dao": {
                                selectorType: "range",
                                range: { start: 1, end: 2 }
                            },
                            "s-bao": {
                                selectorType: "range",
                                range: { start: 2, end: 3 }
                            }
                        },
                        selections: [
                            {
                                id: "selection-chi-dao-bao",
                                selectorIds: ["s-chi", "s-dao", "s-bao"],
                                selectionType: "decomposition",
                                textMappingBundles: [
                                    {
                                        id: "map-bundle-chi",
                                        source: "s-chi",
                                        mappings: [
                                            {
                                                id: "map-chi-gloss",
                                                mappingType: "gloss",
                                                image: {
                                                    id: "line-chi-gloss-en",
                                                    content: {
                                                        text: "eat",
                                                        languageId: "en",
                                                        formId: "gloss"
                                                    }
                                                }
                                            }
                                        ]
                                    },
                                    {
                                        id: "map-bundle-dao",
                                        source: "s-dao",
                                        mappings: [
                                            {
                                                id: "map-dao-gloss",
                                                mappingType: "gloss",
                                                image: {
                                                    id: "line-dao-gloss-en",
                                                    content: {
                                                        text: "arrive",
                                                        languageId: "en",
                                                        formId: "gloss"
                                                    }
                                                }
                                            }
                                        ]
                                    },
                                    {
                                        id: "map-bundle-bao",
                                        source: "s-bao",
                                        mappings: [
                                            {
                                                id: "map-bao-gloss",
                                                mappingType: "gloss",
                                                image: {
                                                    id: "line-bao-gloss-en",
                                                    content: {
                                                        text: "full",
                                                        languageId: "en",
                                                        formId: "gloss"
                                                    }
                                                }
                                            }
                                        ]
                                    }
                                ],
                                textMappings: [
                                    {
                                        id: "map-selection-translation-en",
                                        mappingType: "translation",
                                        image: {
                                            id: "line-translation-en",
                                            content: {
                                                text: "all-you-can-eat",
                                                languageId: "en",
                                                formId: "surface"
                                            }
                                        }
                                    }
                                ],
                                refs: [
                                    {
                                        id: "ref-selection-tag-1",
                                        body: {
                                            type: "tag",
                                            tags: ["decomposition", "morphology"]
                                        }
                                    }
                                ]
                            }
                        ],
                    }
                }
            ]
        }
    ]
} satisfies Document;