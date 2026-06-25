import type { Document } from "../../app/types/core/document";

export const nestedDecompositionSample = {
	metadata: {
		specVersion: "0.5-draft",
		title: "看不懂 nested decomposition sample",
		documentType: "text",
		defaultLanguageId: "zh-Hant",
		defaultFormId: "surface",
		languages: [
			{ id: "zh-Hant", label: "Traditional Chinese" },
			{ id: "en", label: "English" },
		],
		forms: [
			{ id: "surface", label: "Surface" },
			{ id: "gloss", label: "Gloss" },
		],
	},
	sections: [
		{
			id: "section-kanbudong",
			title: "看不懂",
			level: 1,
			blocks: [
				{
					type: "text",
					text: {
						id: "line-kanbudong",
						content: {
							text: "看不懂",
							languageId: "zh-Hant",
							formId: "surface",
						},
						selectorRecord: {
							"selector-kan": {
								selectorType: "range",
								range: { start: 0, end: 1 },
							},
							"selector-budong": {
								selectorType: "range",
								range: { start: 1, end: 3 },
							},
						},
						selections: [
							{
								id: "selection-kan-budong",
								selectorIds: ["selector-kan", "selector-budong"],
								selectionType: "decomposition",
								label: "看 | 不懂",
								refs: [
									{
										id: "ref-selection-kan-budong-tags",
										body: {
											type: "tag",
											tags: ["decomposition", "phrase-level"],
										},
									},
								],
								textMappings: [
									{
										id: "map-selection-kan-budong-translation-en",
										mappingType: "translation",
										image: {
											id: "line-kanbudong-translation-en",
											content: {
												text: "cannot understand",
												languageId: "en",
												formId: "surface",
											},
										},
									},
								],
								textMappingBundles: [
									{
										id: "bundle-kan-gloss",
										source: "selector-kan",
										mappings: [
											{
												id: "map-kan-gloss-en",
												mappingType: "gloss",
												image: {
													id: "line-kan-gloss-en",
													content: {
														text: "look/read",
														languageId: "en",
														formId: "gloss",
													},
												},
											},
										],
									},
									{
										id: "bundle-budong-mappings",
										source: "selector-budong",
										mappings: [
											{
												id: "map-budong-gloss-en",
												mappingType: "gloss",
												image: {
													id: "line-budong-gloss-en",
													content: {
														text: "not understand",
														languageId: "en",
														formId: "gloss",
													},
													selectorRecord: {
														"selector-not": {
															selectorType: "range",
															range: { start: 0, end: 3 },
														},
														"selector-understand": {
															selectorType: "range",
															range: { start: 4, end: 14 },
														},
													},
													selections: [
														{
															id: "selection-not-understand",
															selectorIds: ["selector-not", "selector-understand"],
															selectionType: "decomposition",
															label: "not | understand",
															refs: [
																{
																	id: "ref-selection-not-understand-tags",
																	body: {
																		type: "tag",
																		tags: ["decomposition", "gloss-tokenization"],
																	},
																},
															],
															refAttachmentBundles: [
																{
																	id: "bundle-not-tags",
																	source: "selector-not",
																	attachments: [
																		{
																			id: "attach-not-negation",
																			ref: {
																				id: "ref-not-negation",
																				body: {
																					type: "tag",
																					tags: ["negation"],
																				},
																			},
																		},
																	],
																},
																{
																	id: "bundle-understand-tags",
																	source: "selector-understand",
																	attachments: [
																		{
																			id: "attach-understand-verb",
																			ref: {
																				id: "ref-understand-verb",
																				body: {
																					type: "tag",
																					tags: ["verb"],
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
											{
												id: "map-budong-local-source",
												mappingType: "localSource",
												image: {
													id: "line-budong-local-source",
													content: {
														text: "不懂",
														languageId: "zh-Hant",
														formId: "surface",
													},
													selectorRecord: {
														"selector-bu": {
															selectorType: "range",
															range: { start: 0, end: 1 },
														},
														"selector-dong": {
															selectorType: "range",
															range: { start: 1, end: 2 },
														},
													},
													selections: [
														{
															id: "selection-bu-dong",
															selectorIds: ["selector-bu", "selector-dong"],
															selectionType: "decomposition",
															label: "不 | 懂",
															refs: [
																{
																	id: "ref-selection-bu-dong-tags",
																	body: {
																		type: "tag",
																		tags: ["decomposition", "nested"],
																	},
																},
															],
															textMappingBundles: [
																{
																	id: "bundle-bu-gloss",
																	source: "selector-bu",
																	mappings: [
																		{
																			id: "map-bu-gloss-en",
																			mappingType: "gloss",
																			image: {
																				id: "line-bu-gloss-en",
																				content: {
																					text: "not",
																					languageId: "en",
																					formId: "gloss",
																				},
																			},
																		},
																	],
																},
																{
																	id: "bundle-dong-gloss",
																	source: "selector-dong",
																	mappings: [
																		{
																			id: "map-dong-gloss-en",
																			mappingType: "gloss",
																			image: {
																				id: "line-dong-gloss-en",
																				content: {
																					text: "understand",
																					languageId: "en",
																					formId: "gloss",
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
										],
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