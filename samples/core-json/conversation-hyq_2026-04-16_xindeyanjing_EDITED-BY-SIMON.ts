import type { Document } from "../../app/types/lcm";

export const conversation = {
  "metadata": {
    "specVersion": "0.4-alpha",
    "title": "新的眼睛",
    "documentType": "conversation",
    "defaultLanguageId": "zh-Hant",
    "defaultFormId": "surface",
    "languages": [
      {
        "id": "zh-Hant",
        "label": "繁體中文"
      },
      {
        "id": "en",
        "label": "English"
      },
      {
        "id": "ja",
        "label": "日本語"
      },
      {
        "id": "zxx",
        "label": "Non-speech"
      }
    ],
    "forms": [
      {
        "id": "surface",
        "label": "Surface"
      }
    ],
    "speakers": [
      {
        "id": "simon",
        "name": "Simon"
      },
      {
        "id": "lan",
        "name": "Lan"
      },
      {
        "id": "simonn",
        "name": "Simonn"
      }
    ]
  },
  "resources": [
    {
      "id": "media-main",
      "type": "media",
      "mediaType": "audio",
      "src": "@/public/sample-media/conversation-hyq_2026-04-16_xindeyanjing_EDITED-BY-SIMON.mp3",
      "label": "Conversation audio"
    }
  ],
  "sections": [
    {
      "id": "section-0001",
      "title": "INTRO 新的眼睛",
      "level": 1,
      "time": {
        "start": 0.0
      },
      "blocks": []
    },
    {
      "id": "section-0002",
      "title": "新的眼睛",
      "level": 2,
      "time": {
        "start": 69.502
      },
      "blocks": [
        {
          "type": "text",
          "text": {
            "id": "section-0002-line-0001",
            "content": {
              "text": "哈羅",
              "languageId": "zh-Hant",
              "formId": "surface"
            },
            "refs": [
              {
                "id": "section-0002-line-0001-speaker",
                "body": {
                  "type": "speaker",
                  "speakerId": "simon"
                }
              },
              {
                "id": "section-0002-line-0001-alignment",
                "body": {
                  "type": "alignment",
                  "mediaRef": {
                    "resourceId": "media-main"
                  },
                  "interval": {
                    "start": 73.807,
                    "end": 74.808
                  }
                }
              }
            ]
          }
        },
        {
          "type": "text",
          "text": {
            "id": "section-0002-line-0002",
            "content": {
              "text": "哈羅",
              "languageId": "zh-Hant",
              "formId": "surface"
            },
            "refs": [
              {
                "id": "section-0002-line-0002-speaker",
                "body": {
                  "type": "speaker",
                  "speakerId": "lan"
                }
              },
              {
                "id": "section-0002-line-0002-alignment",
                "body": {
                  "type": "alignment",
                  "mediaRef": {
                    "resourceId": "media-main"
                  },
                  "interval": {
                    "start": 75.575,
                    "end": 76.509
                  }
                }
              }
            ]
          }
        },
        {
          "type": "text",
          "text": {
            "id": "section-0002-line-0003",
            "content": {
              "text": "你聽得到嗎?",
              "languageId": "zh-Hant",
              "formId": "surface"
            },
            "refs": [
              {
                "id": "section-0002-line-0003-speaker",
                "body": {
                  "type": "speaker",
                  "speakerId": "simon"
                }
              },
              {
                "id": "section-0002-line-0003-alignment",
                "body": {
                  "type": "alignment",
                  "mediaRef": {
                    "resourceId": "media-main"
                  },
                  "interval": {
                    "start": 76.643,
                    "end": 77.544
                  }
                }
              }
            ]
          }
        },
        {
          "type": "text",
          "text": {
            "id": "section-0002-line-0004",
            "content": {
              "text": "聽得到。",
              "languageId": "zh-Hant",
              "formId": "surface"
            },
            "refs": [
              {
                "id": "section-0002-line-0004-speaker",
                "body": {
                  "type": "speaker",
                  "speakerId": "lan"
                }
              },
              {
                "id": "section-0002-line-0004-alignment",
                "body": {
                  "type": "alignment",
                  "mediaRef": {
                    "resourceId": "media-main"
                  },
                  "interval": {
                    "start": 78.111,
                    "end": 79.245
                  }
                }
              }
            ]
          }
        },
        {
          "type": "text",
          "text": {
            "id": "section-0002-line-0005",
            "content": {
              "text": "你看得到嗎?",
              "languageId": "zh-Hant",
              "formId": "surface"
            },
            "refs": [
              {
                "id": "section-0002-line-0005-speaker",
                "body": {
                  "type": "speaker",
                  "speakerId": "simon"
                }
              },
              {
                "id": "section-0002-line-0005-alignment",
                "body": {
                  "type": "alignment",
                  "mediaRef": {
                    "resourceId": "media-main"
                  },
                  "interval": {
                    "start": 79.746,
                    "end": 80.68
                  }
                }
              }
            ]
          }
        },
        {
          "type": "text",
          "text": {
            "id": "section-0002-line-0006",
            "content": {
              "text": "看得到😅。",
              "languageId": "zh-Hant",
              "formId": "surface"
            },
            "refs": [
              {
                "id": "section-0002-line-0006-speaker",
                "body": {
                  "type": "speaker",
                  "speakerId": "lan"
                }
              },
              {
                "id": "section-0002-line-0006-alignment",
                "body": {
                  "type": "alignment",
                  "mediaRef": {
                    "resourceId": "media-main"
                  },
                  "interval": {
                    "start": 81.147,
                    "end": 82.882
                  }
                }
              }
            ]
          }
        },
        {
          "type": "text",
          "text": {
            "id": "section-0002-line-0007",
            "content": {
              "text": "聽我?",
              "languageId": "zh-Hant",
              "formId": "surface"
            },
            "refs": [
              {
                "id": "section-0002-line-0007-speaker",
                "body": {
                  "type": "speaker",
                  "speakerId": "simon"
                }
              },
              {
                "id": "section-0002-line-0007-alignment",
                "body": {
                  "type": "alignment",
                  "mediaRef": {
                    "resourceId": "media-main"
                  },
                  "interval": {
                    "start": 83.249,
                    "end": 84.717
                  }
                }
              }
            ],
            "selectors": [
              {
                "id": "section-0002-line-0007-selector-0001",
                "selectorType": "span",
                "children": [
                  {
                    "id": "section-0002-line-0007-selector-0001-text",
                    "content": {
                      "text": "聽我",
                      "languageId": "zh-Hant",
                      "formId": "surface"
                    },
                    "source": {
                      "type": "selector",
                      "ranges": [
                        {
                          "start": 0,
                          "end": 2
                        }
                      ]
                    }
                  }
                ],
                "refs": [
                  {
                    "id": "section-0002-line-0007-selector-0001-ref-0001",
                    "body": {
                      "type": "tag",
                      "tags": [
                        "unnatural"
                      ]
                    }
                  }
                ]
              }
            ]
          }
        },
        {
          "type": "text",
          "text": {
            "id": "section-0002-line-0008",
            "content": {
              "text": "聽你說是不是?",
              "languageId": "zh-Hant",
              "formId": "surface"
            },
            "refs": [
              {
                "id": "section-0002-line-0008-speaker",
                "body": {
                  "type": "speaker",
                  "speakerId": "lan"
                }
              },
              {
                "id": "section-0002-line-0008-alignment",
                "body": {
                  "type": "alignment",
                  "mediaRef": {
                    "resourceId": "media-main"
                  },
                  "interval": {
                    "start": 85.752,
                    "end": 87.654
                  }
                }
              }
            ]
          }
        },
        {
          "type": "text",
          "text": {
            "id": "section-0002-line-0009",
            "content": {
              "text": "聽我?你看得到嗎?",
              "languageId": "zh-Hant",
              "formId": "surface"
            },
            "refs": [
              {
                "id": "section-0002-line-0009-speaker",
                "body": {
                  "type": "speaker",
                  "speakerId": "simon"
                }
              },
              {
                "id": "section-0002-line-0009-alignment",
                "body": {
                  "type": "alignment",
                  "mediaRef": {
                    "resourceId": "media-main"
                  },
                  "interval": {
                    "start": 87.687,
                    "end": 89.789
                  }
                }
              }
            ],
            "selectors": [
              {
                "id": "section-0002-line-0009-selector-0001",
                "selectorType": "span",
                "children": [
                  {
                    "id": "section-0002-line-0009-selector-0001-text",
                    "content": {
                      "text": "聽我",
                      "languageId": "zh-Hant",
                      "formId": "surface"
                    },
                    "source": {
                      "type": "selector",
                      "ranges": [
                        {
                          "start": 0,
                          "end": 2
                        }
                      ]
                    }
                  }
                ],
                "refs": [
                  {
                    "id": "section-0002-line-0009-selector-0001-ref-0001",
                    "body": {
                      "type": "tag",
                      "tags": [
                        "unnatural"
                      ]
                    }
                  }
                ]
              }
            ]
          }
        },
        {
          "type": "text",
          "text": {
            "id": "section-0002-line-0010",
            "content": {
              "text": "問你。",
              "languageId": "zh-Hant",
              "formId": "surface"
            },
            "refs": [
              {
                "id": "section-0002-line-0010-speaker",
                "body": {
                  "type": "speaker",
                  "speakerId": "lan"
                }
              },
              {
                "id": "section-0002-line-0010-alignment",
                "body": {
                  "type": "alignment",
                  "mediaRef": {
                    "resourceId": "media-main"
                  },
                  "interval": {
                    "start": 90.356,
                    "end": 91.524
                  }
                }
              }
            ]
          }
        },
        {
          "type": "text",
          "text": {
            "id": "section-0002-line-0011",
            "content": {
              "text": "問你。啊！！",
              "languageId": "zh-Hant",
              "formId": "surface"
            },
            "refs": [
              {
                "id": "section-0002-line-0011-speaker",
                "body": {
                  "type": "speaker",
                  "speakerId": "simon"
                }
              },
              {
                "id": "section-0002-line-0011-alignment",
                "body": {
                  "type": "alignment",
                  "mediaRef": {
                    "resourceId": "media-main"
                  },
                  "interval": {
                    "start": 91.791,
                    "end": 93.326
                  }
                }
              }
            ]
          }
        },
        {
          "type": "text",
          "text": {
            "id": "section-0002-line-0012",
            "content": {
              "text": "問と....",
              "languageId": "ja",
              "formId": "surface"
            },
            "refs": [
              {
                "id": "section-0002-line-0012-speaker",
                "body": {
                  "type": "speaker",
                  "speakerId": "simon"
                }
              },
              {
                "id": "section-0002-line-0012-alignment",
                "body": {
                  "type": "alignment",
                  "mediaRef": {
                    "resourceId": "media-main"
                  },
                  "interval": {
                    "start": 94.861,
                    "end": 95.728
                  }
                }
              }
            ]
          }
        },
        {
          "type": "text",
          "text": {
            "id": "section-0002-line-0013",
            "content": {
              "text": "日本人の皆さん！",
              "languageId": "ja",
              "formId": "surface"
            },
            "refs": [
              {
                "id": "section-0002-line-0013-speaker",
                "body": {
                  "type": "speaker",
                  "speakerId": "simon"
                }
              },
              {
                "id": "section-0002-line-0013-alignment",
                "body": {
                  "type": "alignment",
                  "mediaRef": {
                    "resourceId": "media-main"
                  },
                  "interval": {
                    "start": 96.329,
                    "end": 97.764
                  }
                }
              }
            ],
            "selectors": [
              {
                "id": "section-0002-line-0013-selector-0001",
                "selectorType": "span",
                "children": [
                  {
                    "id": "section-0002-line-0013-selector-0001-text",
                    "content": {
                      "text": "日本人の皆さん",
                      "languageId": "ja",
                      "formId": "surface"
                    },
                    "source": {
                      "type": "selector",
                      "ranges": [
                        {
                          "start": 0,
                          "end": 7
                        }
                      ]
                    },
                    "transforms": [
                      {
                        "id": "section-0002-line-0013-selector-0001-text-transform-0001",
                        "transformType": "translation",
                        "output": {
                          "id": "section-0002-line-0013-selector-0001-text-transform-0001-output",
                          "content": {
                            "text": "大家日本人",
                            "languageId": "zh-Hant",
                            "formId": "surface"
                          }
                        }
                      },
                      {
                        "id": "section-0002-line-0013-selector-0001-text-transform-0002",
                        "transformType": "translation",
                        "output": {
                          "id": "section-0002-line-0013-selector-0001-text-transform-0002-output",
                          "content": {
                            "text": "Japanese people!",
                            "languageId": "en",
                            "formId": "surface"
                          }
                        }
                      }
                    ]
                  }
                ]
              }
            ]
          }
        },
        {
          "type": "text",
          "text": {
            "id": "section-0002-line-0014",
            "content": {
              "text": "問。",
              "languageId": "zh-Hant",
              "formId": "surface"
            },
            "refs": [
              {
                "id": "section-0002-line-0014-speaker",
                "body": {
                  "type": "speaker",
                  "speakerId": "simon"
                }
              },
              {
                "id": "section-0002-line-0014-alignment",
                "body": {
                  "type": "alignment",
                  "mediaRef": {
                    "resourceId": "media-main"
                  },
                  "interval": {
                    "start": 101.868,
                    "end": 102.469
                  }
                }
              }
            ]
          }
        },
        {
          "type": "text",
          "text": {
            "id": "section-0002-line-0015",
            "content": {
              "text": "「質問の聞く」のは「問」。",
              "languageId": "ja",
              "formId": "surface"
            },
            "refs": [
              {
                "id": "section-0002-line-0015-speaker",
                "body": {
                  "type": "speaker",
                  "speakerId": "simon"
                }
              },
              {
                "id": "section-0002-line-0015-alignment",
                "body": {
                  "type": "alignment",
                  "mediaRef": {
                    "resourceId": "media-main"
                  },
                  "interval": {
                    "start": 98.098,
                    "end": 101.501
                  }
                }
              }
            ],
            "selectors": [
              {
                "id": "section-0002-line-0015-selector-0001",
                "selectorType": "span",
                "children": [
                  {
                    "id": "section-0002-line-0015-selector-0001-text",
                    "content": {
                      "text": "「質問の聞く」のは",
                      "languageId": "ja",
                      "formId": "surface"
                    },
                    "source": {
                      "type": "selector",
                      "ranges": [
                        {
                          "start": 0,
                          "end": 9
                        }
                      ]
                    },
                    "transforms": [
                      {
                        "id": "section-0002-line-0015-selector-0001-text-transform-0001",
                        "transformType": "translation",
                        "output": {
                          "id": "section-0002-line-0015-selector-0001-text-transform-0001-output",
                          "content": {
                            "text": "聽一個問題是",
                            "languageId": "zh-Hant",
                            "formId": "surface"
                          }
                        }
                      }
                    ]
                  }
                ]
              }
            ]
          }
        },
        {
          "type": "text",
          "text": {
            "id": "section-0002-line-0016",
            "content": {
              "text": "「音楽を聞く」のは「聽」。",
              "languageId": "ja",
              "formId": "surface"
            },
            "refs": [
              {
                "id": "section-0002-line-0016-speaker",
                "body": {
                  "type": "speaker",
                  "speakerId": "simon"
                }
              },
              {
                "id": "section-0002-line-0016-alignment",
                "body": {
                  "type": "alignment",
                  "mediaRef": {
                    "resourceId": "media-main"
                  },
                  "interval": {
                    "start": 103.169,
                    "end": 105.905
                  }
                }
              }
            ],
            "selectors": [
              {
                "id": "section-0002-line-0016-selector-0001",
                "selectorType": "span",
                "children": [
                  {
                    "id": "section-0002-line-0016-selector-0001-text",
                    "content": {
                      "text": "「音楽を聞く」のは",
                      "languageId": "ja",
                      "formId": "surface"
                    },
                    "source": {
                      "type": "selector",
                      "ranges": [
                        {
                          "start": 0,
                          "end": 9
                        }
                      ]
                    },
                    "transforms": [
                      {
                        "id": "section-0002-line-0016-selector-0001-text-transform-0001",
                        "transformType": "translation",
                        "output": {
                          "id": "section-0002-line-0016-selector-0001-text-transform-0001-output",
                          "content": {
                            "text": "聽音樂是",
                            "languageId": "zh-Hant",
                            "formId": "surface"
                          }
                        }
                      }
                    ]
                  }
                ]
              }
            ]
          }
        },
        {
          "type": "text",
          "text": {
            "id": "section-0002-line-0017",
            "content": {
              "text": "沒錯。",
              "languageId": "zh-Hant",
              "formId": "surface"
            },
            "refs": [
              {
                "id": "section-0002-line-0017-speaker",
                "body": {
                  "type": "speaker",
                  "speakerId": "lan"
                }
              },
              {
                "id": "section-0002-line-0017-alignment",
                "body": {
                  "type": "alignment",
                  "mediaRef": {
                    "resourceId": "media-main"
                  },
                  "interval": {
                    "start": 106.439,
                    "end": 108.007
                  }
                }
              }
            ]
          }
        },
        {
          "type": "text",
          "text": {
            "id": "section-0002-line-0018",
            "content": {
              "text": "ha...",
              "languageId": "zh-Hant",
              "formId": "surface"
            },
            "refs": [
              {
                "id": "section-0002-line-0018-speaker",
                "body": {
                  "type": "speaker",
                  "speakerId": "simon"
                }
              },
              {
                "id": "section-0002-line-0018-alignment",
                "body": {
                  "type": "alignment",
                  "mediaRef": {
                    "resourceId": "media-main"
                  },
                  "interval": {
                    "start": 108.408,
                    "end": 109.109
                  }
                }
              }
            ]
          }
        },
        {
          "type": "text",
          "text": {
            "id": "section-0002-line-0019",
            "content": {
              "text": "那我來問了。",
              "languageId": "zh-Hant",
              "formId": "surface"
            },
            "refs": [
              {
                "id": "section-0002-line-0019-speaker",
                "body": {
                  "type": "speaker",
                  "speakerId": "lan"
                }
              },
              {
                "id": "section-0002-line-0019-alignment",
                "body": {
                  "type": "alignment",
                  "mediaRef": {
                    "resourceId": "media-main"
                  },
                  "interval": {
                    "start": 109.709,
                    "end": 110.81
                  }
                }
              }
            ]
          }
        },
        {
          "type": "text",
          "text": {
            "id": "section-0002-line-0020",
            "content": {
              "text": "問你「你看得到嗎?」",
              "languageId": "zh-Hant",
              "formId": "surface"
            },
            "refs": [
              {
                "id": "section-0002-line-0020-speaker",
                "body": {
                  "type": "speaker",
                  "speakerId": "simon"
                }
              },
              {
                "id": "section-0002-line-0020-alignment",
                "body": {
                  "type": "alignment",
                  "mediaRef": {
                    "resourceId": "media-main"
                  },
                  "interval": {
                    "start": 111.044,
                    "end": 113.513
                  }
                }
              }
            ]
          }
        },
        {
          "type": "text",
          "text": {
            "id": "section-0002-line-0021",
            "content": {
              "text": "Simon,你看得到嗎?",
              "languageId": "zh-Hant",
              "formId": "surface"
            },
            "refs": [
              {
                "id": "section-0002-line-0021-speaker",
                "body": {
                  "type": "speaker",
                  "speakerId": "lan"
                }
              },
              {
                "id": "section-0002-line-0021-alignment",
                "body": {
                  "type": "alignment",
                  "mediaRef": {
                    "resourceId": "media-main"
                  },
                  "interval": {
                    "start": 114.114,
                    "end": 115.448
                  }
                }
              }
            ]
          }
        },
        {
          "type": "text",
          "text": {
            "id": "section-0002-line-0022",
            "content": {
              "text": "我看得到。",
              "languageId": "zh-Hant",
              "formId": "surface"
            },
            "refs": [
              {
                "id": "section-0002-line-0022-speaker",
                "body": {
                  "type": "speaker",
                  "speakerId": "simon"
                }
              },
              {
                "id": "section-0002-line-0022-alignment",
                "body": {
                  "type": "alignment",
                  "mediaRef": {
                    "resourceId": "media-main"
                  },
                  "interval": {
                    "start": 116.216,
                    "end": 117.217
                  }
                }
              }
            ]
          }
        },
        {
          "type": "text",
          "text": {
            "id": "section-0002-line-0023",
            "content": {
              "text": "因為這週我...戴?帶？待？",
              "languageId": "zh-Hant",
              "formId": "surface"
            },
            "refs": [
              {
                "id": "section-0002-line-0023-speaker",
                "body": {
                  "type": "speaker",
                  "speakerId": "simon"
                }
              },
              {
                "id": "section-0002-line-0023-alignment",
                "body": {
                  "type": "alignment",
                  "mediaRef": {
                    "resourceId": "media-main"
                  },
                  "interval": {
                    "start": 118.318,
                    "end": 124.958
                  }
                }
              }
            ]
          }
        },
        {
          "type": "text",
          "text": {
            "id": "section-0002-line-0024",
            "content": {
              "text": "戴",
              "languageId": "zh-Hant",
              "formId": "surface"
            },
            "refs": [
              {
                "id": "section-0002-line-0024-speaker",
                "body": {
                  "type": "speaker",
                  "speakerId": "lan"
                }
              },
              {
                "id": "section-0002-line-0024-alignment",
                "body": {
                  "type": "alignment",
                  "mediaRef": {
                    "resourceId": "media-main"
                  },
                  "interval": {
                    "start": 125.558,
                    "end": 126.159
                  }
                }
              }
            ]
          }
        },
        {
          "type": "text",
          "text": {
            "id": "section-0002-line-0025",
            "content": {
              "text": "我戴這個新的眼睛",
              "languageId": "zh-Hant",
              "formId": "surface"
            },
            "refs": [
              {
                "id": "section-0002-line-0025-speaker",
                "body": {
                  "type": "speaker",
                  "speakerId": "simon"
                }
              },
              {
                "id": "section-0002-line-0025-alignment",
                "body": {
                  "type": "alignment",
                  "mediaRef": {
                    "resourceId": "media-main"
                  },
                  "interval": {
                    "start": 126.459,
                    "end": 133.199
                  }
                }
              }
            ]
          }
        },
        {
          "type": "text",
          "text": {
            "id": "section-0002-line-0026",
            "content": {
              "text": "眼睛",
              "languageId": "zh-Hant",
              "formId": "surface"
            },
            "refs": [
              {
                "id": "section-0002-line-0026-speaker",
                "body": {
                  "type": "speaker",
                  "speakerId": "lan"
                }
              },
              {
                "id": "section-0002-line-0026-alignment",
                "body": {
                  "type": "alignment",
                  "mediaRef": {
                    "resourceId": "media-main"
                  },
                  "interval": {
                    "start": 133.867,
                    "end": 134.968
                  }
                }
              }
            ]
          }
        },
        {
          "type": "text",
          "text": {
            "id": "section-0002-line-0027",
            "content": {
              "text": "眼睛。",
              "languageId": "zh-Hant",
              "formId": "surface"
            },
            "refs": [
              {
                "id": "section-0002-line-0027-speaker",
                "body": {
                  "type": "speaker",
                  "speakerId": "simon"
                }
              },
              {
                "id": "section-0002-line-0027-alignment",
                "body": {
                  "type": "alignment",
                  "mediaRef": {
                    "resourceId": "media-main"
                  },
                  "interval": {
                    "start": 135.135,
                    "end": 136.169
                  }
                }
              }
            ]
          }
        },
        {
          "type": "text",
          "text": {
            "id": "section-0002-line-0028",
            "content": {
              "text": "然後我看得到,但是",
              "languageId": "zh-Hant",
              "formId": "surface"
            },
            "refs": [
              {
                "id": "section-0002-line-0028-speaker",
                "body": {
                  "type": "speaker",
                  "speakerId": "simon"
                }
              },
              {
                "id": "section-0002-line-0028-alignment",
                "body": {
                  "type": "alignment",
                  "mediaRef": {
                    "resourceId": "media-main"
                  },
                  "interval": {
                    "start": 137.67,
                    "end": 140.24
                  }
                }
              }
            ]
          }
        },
        {
          "type": "text",
          "text": {
            "id": "section-0002-line-0029",
            "content": {
              "text": "這週因為我五十一歲",
              "languageId": "zh-Hant",
              "formId": "surface"
            },
            "refs": [
              {
                "id": "section-0002-line-0029-speaker",
                "body": {
                  "type": "speaker",
                  "speakerId": "simon"
                }
              },
              {
                "id": "section-0002-line-0029-alignment",
                "body": {
                  "type": "alignment",
                  "mediaRef": {
                    "resourceId": "media-main"
                  },
                  "interval": {
                    "start": 140.74,
                    "end": 145.111
                  }
                }
              }
            ]
          }
        },
        {
          "type": "text",
          "text": {
            "id": "section-0002-line-0030",
            "content": {
              "text": "我的眼....",
              "languageId": "zh-Hant",
              "formId": "surface"
            },
            "refs": [
              {
                "id": "section-0002-line-0030-speaker",
                "body": {
                  "type": "speaker",
                  "speakerId": "simon"
                }
              },
              {
                "id": "section-0002-line-0030-alignment",
                "body": {
                  "type": "alignment",
                  "mediaRef": {
                    "resourceId": "media-main"
                  },
                  "interval": {
                    "start": 146.846,
                    "end": 150.85
                  }
                }
              }
            ]
          }
        },
        {
          "type": "text",
          "text": {
            "id": "section-0002-line-0031",
            "content": {
              "text": "メガネは眼鏡。",
              "languageId": "zh-Hant",
              "formId": "surface"
            },
            "refs": [
              {
                "id": "section-0002-line-0031-speaker",
                "body": {
                  "type": "speaker",
                  "speakerId": "simon"
                }
              },
              {
                "id": "section-0002-line-0031-alignment",
                "body": {
                  "type": "alignment",
                  "mediaRef": {
                    "resourceId": "media-main"
                  },
                  "interval": {
                    "start": 151.284,
                    "end": 152.619
                  }
                }
              }
            ]
          }
        },
        {
          "type": "text",
          "text": {
            "id": "section-0002-line-0032",
            "content": {
              "text": "メガネは眼鏡。",
              "languageId": "zh-Hant",
              "formId": "surface"
            },
            "refs": [
              {
                "id": "section-0002-line-0032-speaker",
                "body": {
                  "type": "speaker",
                  "speakerId": "lan"
                }
              },
              {
                "id": "section-0002-line-0032-alignment",
                "body": {
                  "type": "alignment",
                  "mediaRef": {
                    "resourceId": "media-main"
                  },
                  "interval": {
                    "start": 153.553,
                    "end": 155.054
                  }
                }
              }
            ]
          }
        },
        {
          "type": "text",
          "text": {
            "id": "section-0002-line-0033",
            "content": {
              "text": "眼鏡。目は？",
              "languageId": "zh-Hant",
              "formId": "surface"
            },
            "refs": [
              {
                "id": "section-0002-line-0033-speaker",
                "body": {
                  "type": "speaker",
                  "speakerId": "simon"
                }
              },
              {
                "id": "section-0002-line-0033-alignment",
                "body": {
                  "type": "alignment",
                  "mediaRef": {
                    "resourceId": "media-main"
                  },
                  "interval": {
                    "start": 155.388,
                    "end": 157.39
                  }
                }
              }
            ],
            "selectors": [
              {
                "id": "section-0002-line-0033-selector-0001",
                "selectorType": "span",
                "children": [
                  {
                    "id": "section-0002-line-0033-selector-0001-text",
                    "content": {
                      "text": "目は",
                      "languageId": "zh-Hant",
                      "formId": "surface"
                    },
                    "source": {
                      "type": "selector",
                      "ranges": [
                        {
                          "start": 3,
                          "end": 5
                        }
                      ]
                    },
                    "transforms": [
                      {
                        "id": "section-0002-line-0033-selector-0001-text-transform-0001",
                        "transformType": "translation",
                        "output": {
                          "id": "section-0002-line-0033-selector-0001-text-transform-0001-output",
                          "content": {
                            "text": "眼睛是？",
                            "languageId": "zh-Hant",
                            "formId": "surface"
                          }
                        }
                      }
                    ]
                  }
                ]
              }
            ]
          }
        },
        {
          "type": "text",
          "text": {
            "id": "section-0002-line-0034",
            "content": {
              "text": "眼鏡。",
              "languageId": "zh-Hant",
              "formId": "surface"
            },
            "refs": [
              {
                "id": "section-0002-line-0034-speaker",
                "body": {
                  "type": "speaker",
                  "speakerId": "lan"
                }
              },
              {
                "id": "section-0002-line-0034-alignment",
                "body": {
                  "type": "alignment",
                  "mediaRef": {
                    "resourceId": "media-main"
                  },
                  "interval": {
                    "start": 158.024,
                    "end": 158.992
                  }
                }
              }
            ]
          }
        },
        {
          "type": "text",
          "text": {
            "id": "section-0002-line-0035",
            "content": {
              "text": "嗨!😫😫😫",
              "languageId": "zh-Hant",
              "formId": "surface"
            },
            "refs": [
              {
                "id": "section-0002-line-0035-speaker",
                "body": {
                  "type": "speaker",
                  "speakerId": "simon"
                }
              },
              {
                "id": "section-0002-line-0035-alignment",
                "body": {
                  "type": "alignment",
                  "mediaRef": {
                    "resourceId": "media-main"
                  },
                  "interval": {
                    "start": 159.092,
                    "end": 159.926
                  }
                }
              }
            ]
          }
        },
        {
          "type": "text",
          "text": {
            "id": "section-0002-line-0036",
            "content": {
              "text": "はいはいはい...",
              "languageId": "zh-Hant",
              "formId": "surface"
            },
            "refs": [
              {
                "id": "section-0002-line-0036-speaker",
                "body": {
                  "type": "speaker",
                  "speakerId": "simon"
                }
              },
              {
                "id": "section-0002-line-0036-alignment",
                "body": {
                  "type": "alignment",
                  "mediaRef": {
                    "resourceId": "media-main"
                  },
                  "interval": {
                    "start": 162.0,
                    "end": 164.0
                  }
                }
              }
            ],
            "selectors": [
              {
                "id": "section-0002-line-0036-selector-0001",
                "selectorType": "span",
                "children": [
                  {
                    "id": "section-0002-line-0036-selector-0001-text",
                    "content": {
                      "text": "はいはいはい",
                      "languageId": "zh-Hant",
                      "formId": "surface"
                    },
                    "source": {
                      "type": "selector",
                      "ranges": [
                        {
                          "start": 0,
                          "end": 6
                        }
                      ]
                    },
                    "transforms": [
                      {
                        "id": "section-0002-line-0036-selector-0001-text-transform-0001",
                        "transformType": "translation",
                        "output": {
                          "id": "section-0002-line-0036-selector-0001-text-transform-0001-output",
                          "content": {
                            "text": "對對對",
                            "languageId": "zh-Hant",
                            "formId": "surface"
                          }
                        }
                      },
                      {
                        "id": "section-0002-line-0036-selector-0001-text-transform-0002",
                        "transformType": "translation",
                        "output": {
                          "id": "section-0002-line-0036-selector-0001-text-transform-0002-output",
                          "content": {
                            "text": "yes yes yes",
                            "languageId": "en",
                            "formId": "surface"
                          }
                        }
                      }
                    ]
                  }
                ]
              }
            ]
          }
        },
        {
          "type": "text",
          "text": {
            "id": "section-0002-line-0037",
            "content": {
              "text": "有一點困難。",
              "languageId": "zh-Hant",
              "formId": "surface"
            },
            "refs": [
              {
                "id": "section-0002-line-0037-speaker",
                "body": {
                  "type": "speaker",
                  "speakerId": "simon"
                }
              },
              {
                "id": "section-0002-line-0037-alignment",
                "body": {
                  "type": "alignment",
                  "mediaRef": {
                    "resourceId": "media-main"
                  },
                  "interval": {
                    "start": 164.33,
                    "end": 165.765
                  }
                }
              }
            ]
          }
        },
        {
          "type": "text",
          "text": {
            "id": "section-0002-line-0038",
            "content": {
              "text": "發音",
              "languageId": "zh-Hant",
              "formId": "surface"
            },
            "refs": [
              {
                "id": "section-0002-line-0038-speaker",
                "body": {
                  "type": "speaker",
                  "speakerId": "simon"
                }
              },
              {
                "id": "section-0002-line-0038-alignment",
                "body": {
                  "type": "alignment",
                  "mediaRef": {
                    "resourceId": "media-main"
                  },
                  "interval": {
                    "start": 165.865,
                    "end": 167.0
                  }
                }
              }
            ]
          }
        },
        {
          "type": "text",
          "text": {
            "id": "section-0002-line-0039",
            "content": {
              "text": "這個發音有一點困難。",
              "languageId": "zh-Hant",
              "formId": "surface"
            },
            "refs": [
              {
                "id": "section-0002-line-0039-speaker",
                "body": {
                  "type": "speaker",
                  "speakerId": "simon"
                }
              },
              {
                "id": "section-0002-line-0039-alignment",
                "body": {
                  "type": "alignment",
                  "mediaRef": {
                    "resourceId": "media-main"
                  },
                  "interval": {
                    "start": 167.267,
                    "end": 169.269
                  }
                }
              }
            ]
          }
        },
        {
          "type": "text",
          "text": {
            "id": "section-0002-line-0040",
            "content": {
              "text": "很像。",
              "languageId": "zh-Hant",
              "formId": "surface"
            },
            "refs": [
              {
                "id": "section-0002-line-0040-speaker",
                "body": {
                  "type": "speaker",
                  "speakerId": "lan"
                }
              },
              {
                "id": "section-0002-line-0040-alignment",
                "body": {
                  "type": "alignment",
                  "mediaRef": {
                    "resourceId": "media-main"
                  },
                  "interval": {
                    "start": 169.502,
                    "end": 170.136
                  }
                }
              }
            ]
          }
        },
        {
          "type": "text",
          "text": {
            "id": "section-0002-line-0041",
            "content": {
              "text": "因為我是五十一歲",
              "languageId": "zh-Hant",
              "formId": "surface"
            },
            "refs": [
              {
                "id": "section-0002-line-0041-speaker",
                "body": {
                  "type": "speaker",
                  "speakerId": "simon"
                }
              },
              {
                "id": "section-0002-line-0041-alignment",
                "body": {
                  "type": "alignment",
                  "mediaRef": {
                    "resourceId": "media-main"
                  },
                  "interval": {
                    "start": 170.403,
                    "end": 174.941
                  }
                }
              }
            ]
          }
        },
        {
          "type": "text",
          "text": {
            "id": "section-0002-line-0042",
            "content": {
              "text": "我的眼睛",
              "languageId": "zh-Hant",
              "formId": "surface"
            },
            "refs": [
              {
                "id": "section-0002-line-0042-speaker",
                "body": {
                  "type": "speaker",
                  "speakerId": "simon"
                }
              },
              {
                "id": "section-0002-line-0042-alignment",
                "body": {
                  "type": "alignment",
                  "mediaRef": {
                    "resourceId": "media-main"
                  },
                  "interval": {
                    "start": 175.475,
                    "end": 178.011
                  }
                }
              }
            ]
          }
        },
        {
          "type": "text",
          "text": {
            "id": "section-0002-line-0043",
            "content": {
              "text": "對。",
              "languageId": "zh-Hant",
              "formId": "surface"
            },
            "refs": [
              {
                "id": "section-0002-line-0043-speaker",
                "body": {
                  "type": "speaker",
                  "speakerId": "lan"
                }
              },
              {
                "id": "section-0002-line-0043-alignment",
                "body": {
                  "type": "alignment",
                  "mediaRef": {
                    "resourceId": "media-main"
                  },
                  "interval": {
                    "start": 178.545,
                    "end": 179.245
                  }
                }
              }
            ]
          }
        },
        {
          "type": "text",
          "text": {
            "id": "section-0002-line-0044",
            "content": {
              "text": "變成有一點不好。",
              "languageId": "zh-Hant",
              "formId": "surface"
            },
            "refs": [
              {
                "id": "section-0002-line-0044-speaker",
                "body": {
                  "type": "speaker",
                  "speakerId": "simon"
                }
              },
              {
                "id": "section-0002-line-0044-alignment",
                "body": {
                  "type": "alignment",
                  "mediaRef": {
                    "resourceId": "media-main"
                  },
                  "interval": {
                    "start": 179.412,
                    "end": 182.749
                  }
                }
              }
            ]
          }
        },
        {
          "type": "text",
          "text": {
            "id": "section-0002-line-0045",
            "content": {
              "text": "怎麼說?",
              "languageId": "zh-Hant",
              "formId": "surface"
            },
            "refs": [
              {
                "id": "section-0002-line-0045-speaker",
                "body": {
                  "type": "speaker",
                  "speakerId": "simon"
                }
              },
              {
                "id": "section-0002-line-0045-alignment",
                "body": {
                  "type": "alignment",
                  "mediaRef": {
                    "resourceId": "media-main"
                  },
                  "interval": {
                    "start": 182.815,
                    "end": 183.583
                  }
                }
              }
            ]
          }
        },
        {
          "type": "text",
          "text": {
            "id": "section-0002-line-0046",
            "content": {
              "text": "變差了。",
              "languageId": "zh-Hant",
              "formId": "surface"
            },
            "refs": [
              {
                "id": "section-0002-line-0046-speaker",
                "body": {
                  "type": "speaker",
                  "speakerId": "lan"
                }
              },
              {
                "id": "section-0002-line-0046-alignment",
                "body": {
                  "type": "alignment",
                  "mediaRef": {
                    "resourceId": "media-main"
                  },
                  "interval": {
                    "start": 183.583,
                    "end": 185.084
                  }
                }
              }
            ]
          }
        },
        {
          "type": "text",
          "text": {
            "id": "section-0002-line-0047",
            "content": {
              "text": "眼睛變差了。",
              "languageId": "zh-Hant",
              "formId": "surface"
            },
            "refs": [
              {
                "id": "section-0002-line-0047-speaker",
                "body": {
                  "type": "speaker",
                  "speakerId": "lan"
                }
              },
              {
                "id": "section-0002-line-0047-alignment",
                "body": {
                  "type": "alignment",
                  "mediaRef": {
                    "resourceId": "media-main"
                  },
                  "interval": {
                    "start": 186.786,
                    "end": 188.788
                  }
                }
              }
            ]
          }
        },
        {
          "type": "text",
          "text": {
            "id": "section-0002-line-0048",
            "content": {
              "text": "啊!",
              "languageId": "zh-Hant",
              "formId": "surface"
            },
            "refs": [
              {
                "id": "section-0002-line-0048-speaker",
                "body": {
                  "type": "speaker",
                  "speakerId": "simon"
                }
              },
              {
                "id": "section-0002-line-0048-alignment",
                "body": {
                  "type": "alignment",
                  "mediaRef": {
                    "resourceId": "media-main"
                  },
                  "interval": {
                    "start": 188.755,
                    "end": 189.489
                  }
                }
              }
            ]
          }
        },
        {
          "type": "text",
          "text": {
            "id": "section-0002-line-0049",
            "content": {
              "text": "我的眼睛變差了。",
              "languageId": "zh-Hant",
              "formId": "surface"
            },
            "refs": [
              {
                "id": "section-0002-line-0049-speaker",
                "body": {
                  "type": "speaker",
                  "speakerId": "simon"
                }
              },
              {
                "id": "section-0002-line-0049-alignment",
                "body": {
                  "type": "alignment",
                  "mediaRef": {
                    "resourceId": "media-main"
                  },
                  "interval": {
                    "start": 189.689,
                    "end": 191.691
                  }
                }
              }
            ]
          }
        },
        {
          "type": "text",
          "text": {
            "id": "section-0002-line-0050",
            "content": {
              "text": "嗯。",
              "languageId": "zh-Hant",
              "formId": "surface"
            },
            "refs": [
              {
                "id": "section-0002-line-0050-speaker",
                "body": {
                  "type": "speaker",
                  "speakerId": "lan"
                }
              },
              {
                "id": "section-0002-line-0050-alignment",
                "body": {
                  "type": "alignment",
                  "mediaRef": {
                    "resourceId": "media-main"
                  },
                  "interval": {
                    "start": 192.258,
                    "end": 193.193
                  }
                }
              }
            ]
          }
        },
        {
          "type": "text",
          "text": {
            "id": "section-0002-line-0051",
            "content": {
              "text": "然後,這週",
              "languageId": "zh-Hant",
              "formId": "surface"
            },
            "refs": [
              {
                "id": "section-0002-line-0051-speaker",
                "body": {
                  "type": "speaker",
                  "speakerId": "simon"
                }
              },
              {
                "id": "section-0002-line-0051-alignment",
                "body": {
                  "type": "alignment",
                  "mediaRef": {
                    "resourceId": "media-main"
                  },
                  "interval": {
                    "start": 193.76,
                    "end": 195.762
                  }
                }
              }
            ]
          }
        },
        {
          "type": "text",
          "text": {
            "id": "section-0002-line-0052",
            "content": {
              "text": "下週(先週)。",
              "languageId": "zh-Hant",
              "formId": "surface"
            },
            "refs": [
              {
                "id": "section-0002-line-0052-speaker",
                "body": {
                  "type": "speaker",
                  "speakerId": "simon"
                }
              },
              {
                "id": "section-0002-line-0052-alignment",
                "body": {
                  "type": "alignment",
                  "mediaRef": {
                    "resourceId": "media-main"
                  },
                  "interval": {
                    "start": 196.095,
                    "end": 197.664
                  }
                }
              }
            ],
            "selectors": [
              {
                "id": "section-0002-line-0052-selector-0001",
                "selectorType": "span",
                "children": [
                  {
                    "id": "section-0002-line-0052-selector-0001-text",
                    "content": {
                      "text": "先週",
                      "languageId": "zh-Hant",
                      "formId": "surface"
                    },
                    "source": {
                      "type": "selector",
                      "ranges": [
                        {
                          "start": 3,
                          "end": 5
                        }
                      ]
                    },
                    "transforms": [
                      {
                        "id": "section-0002-line-0052-selector-0001-text-transform-0001",
                        "transformType": "translation",
                        "output": {
                          "id": "section-0002-line-0052-selector-0001-text-transform-0001-output",
                          "content": {
                            "text": "下週",
                            "languageId": "zh-Hant",
                            "formId": "surface"
                          }
                        }
                      },
                      {
                        "id": "section-0002-line-0052-selector-0001-text-transform-0002",
                        "transformType": "translation",
                        "output": {
                          "id": "section-0002-line-0052-selector-0001-text-transform-0002-output",
                          "content": {
                            "text": "last week",
                            "languageId": "en",
                            "formId": "surface"
                          }
                        }
                      }
                    ]
                  }
                ]
              }
            ]
          }
        },
        {
          "type": "text",
          "text": {
            "id": "section-0002-line-0053",
            "content": {
              "text": "下週,我",
              "languageId": "zh-Hant",
              "formId": "surface"
            },
            "refs": [
              {
                "id": "section-0002-line-0053-speaker",
                "body": {
                  "type": "speaker",
                  "speakerId": "simon"
                }
              },
              {
                "id": "section-0002-line-0053-alignment",
                "body": {
                  "type": "alignment",
                  "mediaRef": {
                    "resourceId": "media-main"
                  },
                  "interval": {
                    "start": 197.096,
                    "end": 199.098
                  }
                }
              }
            ]
          }
        },
        {
          "type": "text",
          "text": {
            "id": "section-0002-line-0054",
            "content": {
              "text": "我...「春休み」怎麼說?",
              "languageId": "zh-Hant",
              "formId": "surface"
            },
            "refs": [
              {
                "id": "section-0002-line-0054-speaker",
                "body": {
                  "type": "speaker",
                  "speakerId": "simon"
                }
              },
              {
                "id": "section-0002-line-0054-alignment",
                "body": {
                  "type": "alignment",
                  "mediaRef": {
                    "resourceId": "media-main"
                  },
                  "interval": {
                    "start": 202.669,
                    "end": 204.904
                  }
                }
              }
            ],
            "selectors": [
              {
                "id": "section-0002-line-0054-selector-0001",
                "selectorType": "span",
                "children": [
                  {
                    "id": "section-0002-line-0054-selector-0001-text",
                    "content": {
                      "text": "春休み",
                      "languageId": "zh-Hant",
                      "formId": "surface"
                    },
                    "source": {
                      "type": "selector",
                      "ranges": [
                        {
                          "start": 5,
                          "end": 8
                        }
                      ]
                    },
                    "transforms": [
                      {
                        "id": "section-0002-line-0054-selector-0001-text-transform-0001",
                        "transformType": "translation",
                        "output": {
                          "id": "section-0002-line-0054-selector-0001-text-transform-0001-output",
                          "content": {
                            "text": "春假",
                            "languageId": "zh-Hant",
                            "formId": "surface"
                          }
                        }
                      },
                      {
                        "id": "section-0002-line-0054-selector-0001-text-transform-0002",
                        "transformType": "translation",
                        "output": {
                          "id": "section-0002-line-0054-selector-0001-text-transform-0002-output",
                          "content": {
                            "text": "spring vacation",
                            "languageId": "en",
                            "formId": "surface"
                          }
                        }
                      }
                    ]
                  }
                ]
              }
            ]
          }
        },
        {
          "type": "text",
          "text": {
            "id": "section-0002-line-0055",
            "content": {
              "text": "春假。",
              "languageId": "zh-Hant",
              "formId": "surface"
            },
            "refs": [
              {
                "id": "section-0002-line-0055-speaker",
                "body": {
                  "type": "speaker",
                  "speakerId": "lan"
                }
              },
              {
                "id": "section-0002-line-0055-alignment",
                "body": {
                  "type": "alignment",
                  "mediaRef": {
                    "resourceId": "media-main"
                  },
                  "interval": {
                    "start": 205.371,
                    "end": 206.072
                  }
                }
              }
            ]
          }
        },
        {
          "type": "text",
          "text": {
            "id": "section-0002-line-0056",
            "content": {
              "text": "春假。",
              "languageId": "zh-Hant",
              "formId": "surface"
            },
            "refs": [
              {
                "id": "section-0002-line-0056-speaker",
                "body": {
                  "type": "speaker",
                  "speakerId": "simon"
                }
              },
              {
                "id": "section-0002-line-0056-alignment",
                "body": {
                  "type": "alignment",
                  "mediaRef": {
                    "resourceId": "media-main"
                  },
                  "interval": {
                    "start": 206.406,
                    "end": 208.408
                  }
                }
              }
            ]
          }
        },
        {
          "type": "text",
          "text": {
            "id": "section-0002-line-0057",
            "content": {
              "text": "我每天",
              "languageId": "zh-Hant",
              "formId": "surface"
            },
            "refs": [
              {
                "id": "section-0002-line-0057-speaker",
                "body": {
                  "type": "speaker",
                  "speakerId": "simon"
                }
              },
              {
                "id": "section-0002-line-0057-alignment",
                "body": {
                  "type": "alignment",
                  "mediaRef": {
                    "resourceId": "media-main"
                  },
                  "interval": {
                    "start": 208.908,
                    "end": 210.643
                  }
                }
              }
            ]
          }
        },
        {
          "type": "text",
          "text": {
            "id": "section-0002-line-0058",
            "content": {
              "text": "帶",
              "languageId": "zh-Hant",
              "formId": "surface"
            },
            "refs": [
              {
                "id": "section-0002-line-0058-speaker",
                "body": {
                  "type": "speaker",
                  "speakerId": "simon"
                }
              },
              {
                "id": "section-0002-line-0058-alignment",
                "body": {
                  "type": "alignment",
                  "mediaRef": {
                    "resourceId": "media-main"
                  },
                  "interval": {
                    "start": 211.811,
                    "end": 212.445
                  }
                }
              }
            ]
          }
        },
        {
          "type": "text",
          "text": {
            "id": "section-0002-line-0059",
            "content": {
              "text": "老人",
              "languageId": "zh-Hant",
              "formId": "surface"
            },
            "refs": [
              {
                "id": "section-0002-line-0059-speaker",
                "body": {
                  "type": "speaker",
                  "speakerId": "simon"
                }
              },
              {
                "id": "section-0002-line-0059-alignment",
                "body": {
                  "type": "alignment",
                  "mediaRef": {
                    "resourceId": "media-main"
                  },
                  "interval": {
                    "start": 212.912,
                    "end": 213.88
                  }
                }
              }
            ],
            "selectors": [
              {
                "id": "section-0002-line-0059-selector-0001",
                "selectorType": "span",
                "children": [
                  {
                    "id": "section-0002-line-0059-selector-0001-text",
                    "content": {
                      "text": "老人",
                      "languageId": "zh-Hant",
                      "formId": "surface"
                    },
                    "source": {
                      "type": "selector",
                      "ranges": [
                        {
                          "start": 0,
                          "end": 2
                        }
                      ]
                    },
                    "transforms": [
                      {
                        "id": "section-0002-line-0059-selector-0001-text-transform-0001",
                        "transformType": "translation",
                        "output": {
                          "id": "section-0002-line-0059-selector-0001-text-transform-0001-output",
                          "content": {
                            "text": "老人",
                            "languageId": "zh-Hant",
                            "formId": "surface"
                          }
                        }
                      },
                      {
                        "id": "section-0002-line-0059-selector-0001-text-transform-0002",
                        "transformType": "translation",
                        "output": {
                          "id": "section-0002-line-0059-selector-0001-text-transform-0002-output",
                          "content": {
                            "text": "elderly people",
                            "languageId": "en",
                            "formId": "surface"
                          }
                        }
                      }
                    ]
                  }
                ]
              }
            ]
          }
        },
        {
          "type": "text",
          "text": {
            "id": "section-0002-line-0060",
            "content": {
              "text": "老人メガネ,じゃなくて...",
              "languageId": "zh-Hant",
              "formId": "surface"
            },
            "refs": [
              {
                "id": "section-0002-line-0060-speaker",
                "body": {
                  "type": "speaker",
                  "speakerId": "simon"
                }
              },
              {
                "id": "section-0002-line-0060-alignment",
                "body": {
                  "type": "alignment",
                  "mediaRef": {
                    "resourceId": "media-main"
                  },
                  "interval": {
                    "start": 214.047,
                    "end": 216.015
                  }
                }
              }
            ],
            "selectors": [
              {
                "id": "section-0002-line-0060-selector-0001",
                "selectorType": "span",
                "children": [
                  {
                    "id": "section-0002-line-0060-selector-0001-text",
                    "content": {
                      "text": "老人メガネ,じゃなくて",
                      "languageId": "zh-Hant",
                      "formId": "surface"
                    },
                    "source": {
                      "type": "selector",
                      "ranges": [
                        {
                          "start": 0,
                          "end": 11
                        }
                      ]
                    },
                    "transforms": [
                      {
                        "id": "section-0002-line-0060-selector-0001-text-transform-0001",
                        "transformType": "translation",
                        "output": {
                          "id": "section-0002-line-0060-selector-0001-text-transform-0001-output",
                          "content": {
                            "text": "老人眼鏡...不是！",
                            "languageId": "zh-Hant",
                            "formId": "surface"
                          }
                        }
                      },
                      {
                        "id": "section-0002-line-0060-selector-0001-text-transform-0002",
                        "transformType": "translation",
                        "output": {
                          "id": "section-0002-line-0060-selector-0001-text-transform-0002-output",
                          "content": {
                            "text": "old people glasses...that's not right...",
                            "languageId": "en",
                            "formId": "surface"
                          }
                        }
                      }
                    ]
                  }
                ]
              }
            ]
          }
        },
        {
          "type": "text",
          "text": {
            "id": "section-0002-line-0061",
            "content": {
              "text": "老人メガネ,じゃなくて...😂",
              "languageId": "zh-Hant",
              "formId": "surface"
            },
            "refs": [
              {
                "id": "section-0002-line-0061-speaker",
                "body": {
                  "type": "speaker",
                  "speakerId": "simon"
                }
              },
              {
                "id": "section-0002-line-0061-alignment",
                "body": {
                  "type": "alignment",
                  "mediaRef": {
                    "resourceId": "media-main"
                  },
                  "interval": {
                    "start": 217.183,
                    "end": 219.185
                  }
                }
              }
            ]
          }
        },
        {
          "type": "text",
          "text": {
            "id": "section-0002-line-0062",
            "content": {
              "text": "老眼メガネ",
              "languageId": "zh-Hant",
              "formId": "surface"
            },
            "refs": [
              {
                "id": "section-0002-line-0062-speaker",
                "body": {
                  "type": "speaker",
                  "speakerId": "simon"
                }
              },
              {
                "id": "section-0002-line-0062-alignment",
                "body": {
                  "type": "alignment",
                  "mediaRef": {
                    "resourceId": "media-main"
                  },
                  "interval": {
                    "start": 219.385,
                    "end": 221.287
                  }
                }
              }
            ]
          }
        },
        {
          "type": "text",
          "text": {
            "id": "section-0002-line-0063",
            "content": {
              "text": "怎麼說?",
              "languageId": "zh-Hant",
              "formId": "surface"
            },
            "refs": [
              {
                "id": "section-0002-line-0063-speaker",
                "body": {
                  "type": "speaker",
                  "speakerId": "simon"
                }
              },
              {
                "id": "section-0002-line-0063-alignment",
                "body": {
                  "type": "alignment",
                  "mediaRef": {
                    "resourceId": "media-main"
                  },
                  "interval": {
                    "start": 221.621,
                    "end": 222.755
                  }
                }
              }
            ]
          }
        },
        {
          "type": "text",
          "text": {
            "id": "section-0002-line-0064",
            "content": {
              "text": "ちょっと待って",
              "languageId": "zh-Hant",
              "formId": "surface"
            },
            "refs": [
              {
                "id": "section-0002-line-0064-speaker",
                "body": {
                  "type": "speaker",
                  "speakerId": "simon"
                }
              },
              {
                "id": "section-0002-line-0064-alignment",
                "body": {
                  "type": "alignment",
                  "mediaRef": {
                    "resourceId": "media-main"
                  },
                  "interval": {
                    "start": 222.922,
                    "end": 224.791
                  }
                }
              }
            ],
            "selectors": [
              {
                "id": "section-0002-line-0064-selector-0001",
                "selectorType": "span",
                "children": [
                  {
                    "id": "section-0002-line-0064-selector-0001-text",
                    "content": {
                      "text": "ちょっと待って",
                      "languageId": "zh-Hant",
                      "formId": "surface"
                    },
                    "source": {
                      "type": "selector",
                      "ranges": [
                        {
                          "start": 0,
                          "end": 7
                        }
                      ]
                    },
                    "transforms": [
                      {
                        "id": "section-0002-line-0064-selector-0001-text-transform-0001",
                        "transformType": "translation",
                        "output": {
                          "id": "section-0002-line-0064-selector-0001-text-transform-0001-output",
                          "content": {
                            "text": "等一下",
                            "languageId": "zh-Hant",
                            "formId": "surface"
                          }
                        }
                      },
                      {
                        "id": "section-0002-line-0064-selector-0001-text-transform-0002",
                        "transformType": "translation",
                        "output": {
                          "id": "section-0002-line-0064-selector-0001-text-transform-0002-output",
                          "content": {
                            "text": "just a minute",
                            "languageId": "en",
                            "formId": "surface"
                          }
                        }
                      }
                    ]
                  }
                ]
              }
            ]
          }
        },
        {
          "type": "text",
          "text": {
            "id": "section-0002-line-0065",
            "content": {
              "text": "「何というの」は",
              "languageId": "zh-Hant",
              "formId": "surface"
            },
            "refs": [
              {
                "id": "section-0002-line-0065-speaker",
                "body": {
                  "type": "speaker",
                  "speakerId": "simon"
                }
              },
              {
                "id": "section-0002-line-0065-alignment",
                "body": {
                  "type": "alignment",
                  "mediaRef": {
                    "resourceId": "media-main"
                  },
                  "interval": {
                    "start": 225.325,
                    "end": 226.259
                  }
                }
              }
            ],
            "selectors": [
              {
                "id": "section-0002-line-0065-selector-0001",
                "selectorType": "span",
                "children": [
                  {
                    "id": "section-0002-line-0065-selector-0001-text",
                    "content": {
                      "text": "「何というの」は",
                      "languageId": "zh-Hant",
                      "formId": "surface"
                    },
                    "source": {
                      "type": "selector",
                      "ranges": [
                        {
                          "start": 0,
                          "end": 8
                        }
                      ]
                    },
                    "transforms": [
                      {
                        "id": "section-0002-line-0065-selector-0001-text-transform-0001",
                        "transformType": "translation",
                        "output": {
                          "id": "section-0002-line-0065-selector-0001-text-transform-0001-output",
                          "content": {
                            "text": "「怎嗎說」是",
                            "languageId": "zh-Hant",
                            "formId": "surface"
                          }
                        }
                      },
                      {
                        "id": "section-0002-line-0065-selector-0001-text-transform-0002",
                        "transformType": "translation",
                        "output": {
                          "id": "section-0002-line-0065-selector-0001-text-transform-0002-output",
                          "content": {
                            "text": "\"How do you say\" is",
                            "languageId": "en",
                            "formId": "surface"
                          }
                        }
                      }
                    ]
                  }
                ]
              }
            ]
          }
        },
        {
          "type": "text",
          "text": {
            "id": "section-0002-line-0066",
            "content": {
              "text": "什麼說じゃないよね、怎麼說だよね?当たっているよね？",
              "languageId": "zh-Hant",
              "formId": "surface"
            },
            "refs": [
              {
                "id": "section-0002-line-0066-speaker",
                "body": {
                  "type": "speaker",
                  "speakerId": "simon"
                }
              },
              {
                "id": "section-0002-line-0066-alignment",
                "body": {
                  "type": "alignment",
                  "mediaRef": {
                    "resourceId": "media-main"
                  },
                  "interval": {
                    "start": 226.893,
                    "end": 229.195
                  }
                }
              }
            ],
            "transforms": [
              {
                "id": "section-0002-line-0066-transform-0001",
                "transformType": "translation",
                "output": {
                  "id": "section-0002-line-0066-transform-0001-output",
                  "content": {
                    "text": "不是「什麼說」，是「什麼說」對不對？",
                    "languageId": "zh-Hant",
                    "formId": "surface"
                  }
                }
              },
              {
                "id": "section-0002-line-0066-transform-0002",
                "transformType": "translation",
                "output": {
                  "id": "section-0002-line-0066-transform-0002-output",
                  "content": {
                    "text": "it's not “什麼說” it's \"怎麼說\", correct?",
                    "languageId": "en",
                    "formId": "surface"
                  }
                }
              }
            ]
          }
        },
        {
          "type": "text",
          "text": {
            "id": "section-0002-line-0067",
            "content": {
              "text": "怎麼說?",
              "languageId": "zh-Hant",
              "formId": "surface"
            },
            "refs": [
              {
                "id": "section-0002-line-0067-speaker",
                "body": {
                  "type": "speaker",
                  "speakerId": "lan"
                }
              },
              {
                "id": "section-0002-line-0067-alignment",
                "body": {
                  "type": "alignment",
                  "mediaRef": {
                    "resourceId": "media-main"
                  },
                  "interval": {
                    "start": 229.929,
                    "end": 230.663
                  }
                }
              }
            ]
          }
        },
        {
          "type": "text",
          "text": {
            "id": "section-0002-line-0068",
            "content": {
              "text": "怎麼說。「老眼メガネ」是怎麼說?",
              "languageId": "zh-Hant",
              "formId": "surface"
            },
            "refs": [
              {
                "id": "section-0002-line-0068-speaker",
                "body": {
                  "type": "speaker",
                  "speakerId": "simon"
                }
              },
              {
                "id": "section-0002-line-0068-alignment",
                "body": {
                  "type": "alignment",
                  "mediaRef": {
                    "resourceId": "media-main"
                  },
                  "interval": {
                    "start": 230.797,
                    "end": 234.1
                  }
                }
              }
            ],
            "selectors": [
              {
                "id": "section-0002-line-0068-selector-0001",
                "selectorType": "span",
                "children": [
                  {
                    "id": "section-0002-line-0068-selector-0001-text",
                    "content": {
                      "text": "老眼メガネ",
                      "languageId": "zh-Hant",
                      "formId": "surface"
                    },
                    "source": {
                      "type": "selector",
                      "ranges": [
                        {
                          "start": 5,
                          "end": 10
                        }
                      ]
                    },
                    "transforms": [
                      {
                        "id": "section-0002-line-0068-selector-0001-text-transform-0001",
                        "transformType": "translation",
                        "output": {
                          "id": "section-0002-line-0068-selector-0001-text-transform-0001-output",
                          "content": {
                            "text": "老花眼鏡",
                            "languageId": "zh-Hant",
                            "formId": "surface"
                          }
                        }
                      },
                      {
                        "id": "section-0002-line-0068-selector-0001-text-transform-0002",
                        "transformType": "translation",
                        "output": {
                          "id": "section-0002-line-0068-selector-0001-text-transform-0002-output",
                          "content": {
                            "text": "reading glasses",
                            "languageId": "en",
                            "formId": "surface"
                          }
                        }
                      }
                    ]
                  }
                ]
              }
            ]
          }
        },
        {
          "type": "text",
          "text": {
            "id": "section-0002-line-0069",
            "content": {
              "text": "老花眼鏡。",
              "languageId": "zh-Hant",
              "formId": "surface"
            },
            "refs": [
              {
                "id": "section-0002-line-0069-speaker",
                "body": {
                  "type": "speaker",
                  "speakerId": "lan"
                }
              },
              {
                "id": "section-0002-line-0069-alignment",
                "body": {
                  "type": "alignment",
                  "mediaRef": {
                    "resourceId": "media-main"
                  },
                  "interval": {
                    "start": 234.701,
                    "end": 236.703
                  }
                }
              }
            ]
          }
        },
        {
          "type": "text",
          "text": {
            "id": "section-0002-line-0070",
            "content": {
              "text": "ooh",
              "languageId": "zh-Hant",
              "formId": "surface"
            },
            "refs": [
              {
                "id": "section-0002-line-0070-speaker",
                "body": {
                  "type": "speaker",
                  "speakerId": "simonn"
                }
              },
              {
                "id": "section-0002-line-0070-alignment",
                "body": {
                  "type": "alignment",
                  "mediaRef": {
                    "resourceId": "media-main"
                  },
                  "interval": {
                    "start": 237.403,
                    "end": 238.438
                  }
                }
              }
            ]
          }
        },
        {
          "type": "text",
          "text": {
            "id": "section-0002-line-0071",
            "content": {
              "text": "老花眼鏡。",
              "languageId": "zh-Hant",
              "formId": "surface"
            },
            "refs": [
              {
                "id": "section-0002-line-0071-speaker",
                "body": {
                  "type": "speaker",
                  "speakerId": "lan"
                }
              },
              {
                "id": "section-0002-line-0071-alignment",
                "body": {
                  "type": "alignment",
                  "mediaRef": {
                    "resourceId": "media-main"
                  },
                  "interval": {
                    "start": 238.671,
                    "end": 239.539
                  }
                }
              }
            ]
          }
        },
        {
          "type": "text",
          "text": {
            "id": "section-0002-line-0072",
            "content": {
              "text": "老花眼鏡。",
              "languageId": "zh-Hant",
              "formId": "surface"
            },
            "refs": [
              {
                "id": "section-0002-line-0072-speaker",
                "body": {
                  "type": "speaker",
                  "speakerId": "simon"
                }
              },
              {
                "id": "section-0002-line-0072-alignment",
                "body": {
                  "type": "alignment",
                  "mediaRef": {
                    "resourceId": "media-main"
                  },
                  "interval": {
                    "start": 240.039,
                    "end": 242.041
                  }
                }
              }
            ]
          }
        },
        {
          "type": "text",
          "text": {
            "id": "section-0002-line-0073",
            "content": {
              "text": "「老眼」就是老花。",
              "languageId": "zh-Hant",
              "formId": "surface"
            },
            "refs": [
              {
                "id": "section-0002-line-0073-speaker",
                "body": {
                  "type": "speaker",
                  "speakerId": "lan"
                }
              },
              {
                "id": "section-0002-line-0073-alignment",
                "body": {
                  "type": "alignment",
                  "mediaRef": {
                    "resourceId": "media-main"
                  },
                  "interval": {
                    "start": 242.041,
                    "end": 243.643
                  }
                }
              }
            ],
            "selectors": [
              {
                "id": "section-0002-line-0073-selector-0001",
                "selectorType": "span",
                "children": [
                  {
                    "id": "section-0002-line-0073-selector-0001-text",
                    "content": {
                      "text": "老眼",
                      "languageId": "zh-Hant",
                      "formId": "surface"
                    },
                    "source": {
                      "type": "selector",
                      "ranges": [
                        {
                          "start": 1,
                          "end": 3
                        }
                      ]
                    },
                    "transforms": [
                      {
                        "id": "section-0002-line-0073-selector-0001-text-transform-0001",
                        "transformType": "translation",
                        "output": {
                          "id": "section-0002-line-0073-selector-0001-text-transform-0001-output",
                          "content": {
                            "text": "老花",
                            "languageId": "zh-Hant",
                            "formId": "surface"
                          }
                        }
                      },
                      {
                        "id": "section-0002-line-0073-selector-0001-text-transform-0002",
                        "transformType": "translation",
                        "output": {
                          "id": "section-0002-line-0073-selector-0001-text-transform-0002-output",
                          "content": {
                            "text": "age-related presbyopia",
                            "languageId": "en",
                            "formId": "surface"
                          }
                        }
                      }
                    ]
                  }
                ]
              }
            ]
          }
        },
        {
          "type": "text",
          "text": {
            "id": "section-0002-line-0074",
            "content": {
              "text": "啊!",
              "languageId": "zh-Hant",
              "formId": "surface"
            },
            "refs": [
              {
                "id": "section-0002-line-0074-speaker",
                "body": {
                  "type": "speaker",
                  "speakerId": "simon"
                }
              },
              {
                "id": "section-0002-line-0074-alignment",
                "body": {
                  "type": "alignment",
                  "mediaRef": {
                    "resourceId": "media-main"
                  },
                  "interval": {
                    "start": 244.01,
                    "end": 246.012
                  }
                }
              }
            ]
          }
        },
        {
          "type": "text",
          "text": {
            "id": "section-0002-line-0075",
            "content": {
              "text": "花是花の「花」",
              "languageId": "zh-Hant",
              "formId": "surface"
            },
            "refs": [
              {
                "id": "section-0002-line-0075-speaker",
                "body": {
                  "type": "speaker",
                  "speakerId": "simon"
                }
              },
              {
                "id": "section-0002-line-0075-alignment",
                "body": {
                  "type": "alignment",
                  "mediaRef": {
                    "resourceId": "media-main"
                  },
                  "interval": {
                    "start": 246.479,
                    "end": 248.481
                  }
                }
              }
            ]
          }
        },
        {
          "type": "text",
          "text": {
            "id": "section-0002-line-0076",
            "content": {
              "text": "對。",
              "languageId": "zh-Hant",
              "formId": "surface"
            },
            "refs": [
              {
                "id": "section-0002-line-0076-speaker",
                "body": {
                  "type": "speaker",
                  "speakerId": "lan"
                }
              },
              {
                "id": "section-0002-line-0076-alignment",
                "body": {
                  "type": "alignment",
                  "mediaRef": {
                    "resourceId": "media-main"
                  },
                  "interval": {
                    "start": 248.881,
                    "end": 249.415
                  }
                }
              }
            ]
          }
        },
        {
          "type": "text",
          "text": {
            "id": "section-0002-line-0077",
            "content": {
              "text": "因為你看什麼東西都這樣花花的。",
              "languageId": "zh-Hant",
              "formId": "surface"
            },
            "refs": [
              {
                "id": "section-0002-line-0077-speaker",
                "body": {
                  "type": "speaker",
                  "speakerId": "lan"
                }
              },
              {
                "id": "section-0002-line-0077-alignment",
                "body": {
                  "type": "alignment",
                  "mediaRef": {
                    "resourceId": "media-main"
                  },
                  "interval": {
                    "start": 249.449,
                    "end": 252.252
                  }
                }
              }
            ]
          }
        },
        {
          "type": "text",
          "text": {
            "id": "section-0002-line-0078",
            "content": {
              "text": "啊!🤣",
              "languageId": "zh-Hant",
              "formId": "surface"
            },
            "refs": [
              {
                "id": "section-0002-line-0078-speaker",
                "body": {
                  "type": "speaker",
                  "speakerId": "simon"
                }
              },
              {
                "id": "section-0002-line-0078-alignment",
                "body": {
                  "type": "alignment",
                  "mediaRef": {
                    "resourceId": "media-main"
                  },
                  "interval": {
                    "start": 252.385,
                    "end": 254.754
                  }
                }
              }
            ]
          }
        },
        {
          "type": "text",
          "text": {
            "id": "section-0002-line-0079",
            "content": {
              "text": "真的啦!",
              "languageId": "zh-Hant",
              "formId": "surface"
            },
            "refs": [
              {
                "id": "section-0002-line-0079-speaker",
                "body": {
                  "type": "speaker",
                  "speakerId": "lan"
                }
              },
              {
                "id": "section-0002-line-0079-alignment",
                "body": {
                  "type": "alignment",
                  "mediaRef": {
                    "resourceId": "media-main"
                  },
                  "interval": {
                    "start": 254.821,
                    "end": 255.388
                  }
                }
              }
            ]
          }
        },
        {
          "type": "text",
          "text": {
            "id": "section-0002-line-0080",
            "content": {
              "text": "真的。",
              "languageId": "zh-Hant",
              "formId": "surface"
            },
            "refs": [
              {
                "id": "section-0002-line-0080-speaker",
                "body": {
                  "type": "speaker",
                  "speakerId": "simon"
                }
              },
              {
                "id": "section-0002-line-0080-alignment",
                "body": {
                  "type": "alignment",
                  "mediaRef": {
                    "resourceId": "media-main"
                  },
                  "interval": {
                    "start": 255.521,
                    "end": 257.523
                  }
                }
              }
            ]
          }
        },
        {
          "type": "text",
          "text": {
            "id": "section-0002-line-0081",
            "content": {
              "text": "我懂的。",
              "languageId": "zh-Hant",
              "formId": "surface"
            },
            "refs": [
              {
                "id": "section-0002-line-0081-speaker",
                "body": {
                  "type": "speaker",
                  "speakerId": "simon"
                }
              },
              {
                "id": "section-0002-line-0081-alignment",
                "body": {
                  "type": "alignment",
                  "mediaRef": {
                    "resourceId": "media-main"
                  },
                  "interval": {
                    "start": 257.624,
                    "end": 260.793
                  }
                }
              }
            ]
          }
        },
        {
          "type": "text",
          "text": {
            "id": "section-0002-line-0082",
            "content": {
              "text": "我懂的。",
              "languageId": "zh-Hant",
              "formId": "surface"
            },
            "refs": [
              {
                "id": "section-0002-line-0082-speaker",
                "body": {
                  "type": "speaker",
                  "speakerId": "simon"
                }
              },
              {
                "id": "section-0002-line-0082-alignment",
                "body": {
                  "type": "alignment",
                  "mediaRef": {
                    "resourceId": "media-main"
                  },
                  "interval": {
                    "start": 260.994,
                    "end": 261.761
                  }
                }
              }
            ]
          }
        },
        {
          "type": "text",
          "text": {
            "id": "section-0002-line-0083",
            "content": {
              "text": "嗯。",
              "languageId": "zh-Hant",
              "formId": "surface"
            },
            "refs": [
              {
                "id": "section-0002-line-0083-speaker",
                "body": {
                  "type": "speaker",
                  "speakerId": "lan"
                }
              },
              {
                "id": "section-0002-line-0083-alignment",
                "body": {
                  "type": "alignment",
                  "mediaRef": {
                    "resourceId": "media-main"
                  },
                  "interval": {
                    "start": 261.761,
                    "end": 262.195
                  }
                }
              }
            ]
          }
        },
        {
          "type": "text",
          "text": {
            "id": "section-0002-line-0084",
            "content": {
              "text": "這個感覺。",
              "languageId": "zh-Hant",
              "formId": "surface"
            },
            "refs": [
              {
                "id": "section-0002-line-0084-speaker",
                "body": {
                  "type": "speaker",
                  "speakerId": "simon"
                }
              },
              {
                "id": "section-0002-line-0084-alignment",
                "body": {
                  "type": "alignment",
                  "mediaRef": {
                    "resourceId": "media-main"
                  },
                  "interval": {
                    "start": 262.262,
                    "end": 265.231
                  }
                }
              }
            ]
          }
        },
        {
          "type": "text",
          "text": {
            "id": "section-0002-line-0085",
            "content": {
              "text": "對對對。",
              "languageId": "zh-Hant",
              "formId": "surface"
            },
            "refs": [
              {
                "id": "section-0002-line-0085-speaker",
                "body": {
                  "type": "speaker",
                  "speakerId": "simon"
                }
              },
              {
                "id": "section-0002-line-0085-alignment",
                "body": {
                  "type": "alignment",
                  "mediaRef": {
                    "resourceId": "media-main"
                  },
                  "interval": {
                    "start": 265.632,
                    "end": 266.232
                  }
                }
              }
            ]
          }
        },
        {
          "type": "text",
          "text": {
            "id": "section-0002-line-0086",
            "content": {
              "text": "然後,我",
              "languageId": "zh-Hant",
              "formId": "surface"
            },
            "refs": [
              {
                "id": "section-0002-line-0086-speaker",
                "body": {
                  "type": "speaker",
                  "speakerId": "simon"
                }
              },
              {
                "id": "section-0002-line-0086-alignment",
                "body": {
                  "type": "alignment",
                  "mediaRef": {
                    "resourceId": "media-main"
                  },
                  "interval": {
                    "start": 268.067,
                    "end": 269.135
                  }
                }
              }
            ]
          }
        },
        {
          "type": "text",
          "text": {
            "id": "section-0002-line-0087",
            "content": {
              "text": "因為我每天戴",
              "languageId": "zh-Hant",
              "formId": "surface"
            },
            "refs": [
              {
                "id": "section-0002-line-0087-speaker",
                "body": {
                  "type": "speaker",
                  "speakerId": "simon"
                }
              },
              {
                "id": "section-0002-line-0087-alignment",
                "body": {
                  "type": "alignment",
                  "mediaRef": {
                    "resourceId": "media-main"
                  },
                  "interval": {
                    "start": 269.535,
                    "end": 271.904
                  }
                }
              }
            ]
          }
        },
        {
          "type": "text",
          "text": {
            "id": "section-0002-line-0088",
            "content": {
              "text": "老眼メガネ？",
              "languageId": "zh-Hant",
              "formId": "surface"
            },
            "refs": [
              {
                "id": "section-0002-line-0088-speaker",
                "body": {
                  "type": "speaker",
                  "speakerId": "simon"
                }
              },
              {
                "id": "section-0002-line-0088-alignment",
                "body": {
                  "type": "alignment",
                  "mediaRef": {
                    "resourceId": "media-main"
                  },
                  "interval": {
                    "start": 272.272,
                    "end": 273.373
                  }
                }
              }
            ],
            "selectors": [
              {
                "id": "section-0002-line-0088-selector-0001",
                "selectorType": "span",
                "children": [
                  {
                    "id": "section-0002-line-0088-selector-0001-text",
                    "content": {
                      "text": "老眼メガネ",
                      "languageId": "zh-Hant",
                      "formId": "surface"
                    },
                    "source": {
                      "type": "selector",
                      "ranges": [
                        {
                          "start": 0,
                          "end": 5
                        }
                      ]
                    },
                    "transforms": [
                      {
                        "id": "section-0002-line-0088-selector-0001-text-transform-0001",
                        "transformType": "translation",
                        "output": {
                          "id": "section-0002-line-0088-selector-0001-text-transform-0001-output",
                          "content": {
                            "text": "老花眼鏡",
                            "languageId": "zh-Hant",
                            "formId": "surface"
                          }
                        }
                      },
                      {
                        "id": "section-0002-line-0088-selector-0001-text-transform-0002",
                        "transformType": "translation",
                        "output": {
                          "id": "section-0002-line-0088-selector-0001-text-transform-0002-output",
                          "content": {
                            "text": "reading glasses",
                            "languageId": "en",
                            "formId": "surface"
                          }
                        }
                      }
                    ]
                  }
                ]
              }
            ]
          }
        },
        {
          "type": "text",
          "text": {
            "id": "section-0002-line-0089",
            "content": {
              "text": "老花眼鏡。",
              "languageId": "zh-Hant",
              "formId": "surface"
            },
            "refs": [
              {
                "id": "section-0002-line-0089-speaker",
                "body": {
                  "type": "speaker",
                  "speakerId": "lan"
                }
              },
              {
                "id": "section-0002-line-0089-alignment",
                "body": {
                  "type": "alignment",
                  "mediaRef": {
                    "resourceId": "media-main"
                  },
                  "interval": {
                    "start": 273.973,
                    "end": 275.275
                  }
                }
              }
            ]
          }
        },
        {
          "type": "text",
          "text": {
            "id": "section-0002-line-0090",
            "content": {
              "text": "老花眼鏡。",
              "languageId": "zh-Hant",
              "formId": "surface"
            },
            "refs": [
              {
                "id": "section-0002-line-0090-speaker",
                "body": {
                  "type": "speaker",
                  "speakerId": "simon"
                }
              },
              {
                "id": "section-0002-line-0090-alignment",
                "body": {
                  "type": "alignment",
                  "mediaRef": {
                    "resourceId": "media-main"
                  },
                  "interval": {
                    "start": 275.608,
                    "end": 278.945
                  }
                }
              }
            ]
          }
        },
        {
          "type": "text",
          "text": {
            "id": "section-0002-line-0091",
            "content": {
              "text": "老花眼鏡。",
              "languageId": "zh-Hant",
              "formId": "surface"
            },
            "refs": [
              {
                "id": "section-0002-line-0091-speaker",
                "body": {
                  "type": "speaker",
                  "speakerId": "lan"
                }
              },
              {
                "id": "section-0002-line-0091-alignment",
                "body": {
                  "type": "alignment",
                  "mediaRef": {
                    "resourceId": "media-main"
                  },
                  "interval": {
                    "start": 279.345,
                    "end": 280.713
                  }
                }
              }
            ]
          }
        },
        {
          "type": "text",
          "text": {
            "id": "section-0002-line-0092",
            "content": {
              "text": "我感覺",
              "languageId": "zh-Hant",
              "formId": "surface"
            },
            "refs": [
              {
                "id": "section-0002-line-0092-speaker",
                "body": {
                  "type": "speaker",
                  "speakerId": "simon"
                }
              },
              {
                "id": "section-0002-line-0092-alignment",
                "body": {
                  "type": "alignment",
                  "mediaRef": {
                    "resourceId": "media-main"
                  },
                  "interval": {
                    "start": 281.047,
                    "end": 281.814
                  }
                }
              }
            ]
          }
        },
        {
          "type": "text",
          "text": {
            "id": "section-0002-line-0093",
            "content": {
              "text": "用戴了。",
              "languageId": "zh-Hant",
              "formId": "surface"
            },
            "refs": [
              {
                "id": "section-0002-line-0093-speaker",
                "body": {
                  "type": "speaker",
                  "speakerId": "simon"
                }
              },
              {
                "id": "section-0002-line-0093-alignment",
                "body": {
                  "type": "alignment",
                  "mediaRef": {
                    "resourceId": "media-main"
                  },
                  "interval": {
                    "start": 282.315,
                    "end": 284.083
                  }
                }
              }
            ]
          }
        },
        {
          "type": "text",
          "text": {
            "id": "section-0002-line-0094",
            "content": {
              "text": "感覺,あ、感覺じゃない。慣れた",
              "languageId": "zh-Hant",
              "formId": "surface"
            },
            "refs": [
              {
                "id": "section-0002-line-0094-speaker",
                "body": {
                  "type": "speaker",
                  "speakerId": "simon"
                }
              },
              {
                "id": "section-0002-line-0094-alignment",
                "body": {
                  "type": "alignment",
                  "mediaRef": {
                    "resourceId": "media-main"
                  },
                  "interval": {
                    "start": 284.584,
                    "end": 287.02
                  }
                }
              }
            ],
            "transforms": [
              {
                "id": "section-0002-line-0094-transform-0001",
                "transformType": "translation",
                "output": {
                  "id": "section-0002-line-0094-transform-0001-output",
                  "content": {
                    "text": "感覺，啊，不是感覺，習慣了",
                    "languageId": "zh-Hant",
                    "formId": "surface"
                  }
                }
              },
              {
                "id": "section-0002-line-0094-transform-0002",
                "transformType": "translation",
                "output": {
                  "id": "section-0002-line-0094-transform-0002-output",
                  "content": {
                    "text": "感覺, ah wait, not 感覺, I got used to",
                    "languageId": "en",
                    "formId": "surface"
                  }
                }
              }
            ]
          }
        },
        {
          "type": "text",
          "text": {
            "id": "section-0002-line-0095",
            "content": {
              "text": "你習慣了。",
              "languageId": "zh-Hant",
              "formId": "surface"
            },
            "refs": [
              {
                "id": "section-0002-line-0095-speaker",
                "body": {
                  "type": "speaker",
                  "speakerId": "lan"
                }
              },
              {
                "id": "section-0002-line-0095-alignment",
                "body": {
                  "type": "alignment",
                  "mediaRef": {
                    "resourceId": "media-main"
                  },
                  "interval": {
                    "start": 287.186,
                    "end": 288.521
                  }
                }
              }
            ]
          }
        },
        {
          "type": "text",
          "text": {
            "id": "section-0002-line-0096",
            "content": {
              "text": "我習慣了。",
              "languageId": "zh-Hant",
              "formId": "surface"
            },
            "refs": [
              {
                "id": "section-0002-line-0096-speaker",
                "body": {
                  "type": "speaker",
                  "speakerId": "simon"
                }
              },
              {
                "id": "section-0002-line-0096-alignment",
                "body": {
                  "type": "alignment",
                  "mediaRef": {
                    "resourceId": "media-main"
                  },
                  "interval": {
                    "start": 288.888,
                    "end": 290.156
                  }
                }
              }
            ]
          }
        },
        {
          "type": "text",
          "text": {
            "id": "section-0002-line-0097",
            "content": {
              "text": "然後",
              "languageId": "zh-Hant",
              "formId": "surface"
            },
            "refs": [
              {
                "id": "section-0002-line-0097-speaker",
                "body": {
                  "type": "speaker",
                  "speakerId": "simon"
                }
              },
              {
                "id": "section-0002-line-0097-alignment",
                "body": {
                  "type": "alignment",
                  "mediaRef": {
                    "resourceId": "media-main"
                  },
                  "interval": {
                    "start": 290.79,
                    "end": 291.891
                  }
                }
              }
            ]
          }
        },
        {
          "type": "text",
          "text": {
            "id": "section-0002-line-0098",
            "content": {
              "text": "下週",
              "languageId": "zh-Hant",
              "formId": "surface"
            },
            "refs": [
              {
                "id": "section-0002-line-0098-speaker",
                "body": {
                  "type": "speaker",
                  "speakerId": "simon"
                }
              },
              {
                "id": "section-0002-line-0098-alignment",
                "body": {
                  "type": "alignment",
                  "mediaRef": {
                    "resourceId": "media-main"
                  },
                  "interval": {
                    "start": 292.325,
                    "end": 293.126
                  }
                }
              }
            ]
          }
        },
        {
          "type": "text",
          "text": {
            "id": "section-0002-line-0099",
            "content": {
              "text": "開始",
              "languageId": "zh-Hant",
              "formId": "surface"
            },
            "refs": [
              {
                "id": "section-0002-line-0099-speaker",
                "body": {
                  "type": "speaker",
                  "speakerId": "simon"
                }
              },
              {
                "id": "section-0002-line-0099-alignment",
                "body": {
                  "type": "alignment",
                  "mediaRef": {
                    "resourceId": "media-main"
                  },
                  "interval": {
                    "start": 294.527,
                    "end": 295.194
                  }
                }
              }
            ]
          }
        },
        {
          "type": "text",
          "text": {
            "id": "section-0002-line-0100",
            "content": {
              "text": "新的",
              "languageId": "zh-Hant",
              "formId": "surface"
            },
            "refs": [
              {
                "id": "section-0002-line-0100-speaker",
                "body": {
                  "type": "speaker",
                  "speakerId": "simon"
                }
              },
              {
                "id": "section-0002-line-0100-alignment",
                "body": {
                  "type": "alignment",
                  "mediaRef": {
                    "resourceId": "media-main"
                  },
                  "interval": {
                    "start": 295.995,
                    "end": 297.864
                  }
                }
              }
            ]
          }
        },
        {
          "type": "text",
          "text": {
            "id": "section-0002-line-0101",
            "content": {
              "text": "年期",
              "languageId": "zh-Hant",
              "formId": "surface"
            },
            "refs": [
              {
                "id": "section-0002-line-0101-speaker",
                "body": {
                  "type": "speaker",
                  "speakerId": "simon"
                }
              },
              {
                "id": "section-0002-line-0101-alignment",
                "body": {
                  "type": "alignment",
                  "mediaRef": {
                    "resourceId": "media-main"
                  },
                  "interval": {
                    "start": 298.598,
                    "end": 299.899
                  }
                }
              }
            ]
          }
        },
        {
          "type": "text",
          "text": {
            "id": "section-0002-line-0102",
            "content": {
              "text": "年期...",
              "languageId": "zh-Hant",
              "formId": "surface"
            },
            "refs": [
              {
                "id": "section-0002-line-0102-speaker",
                "body": {
                  "type": "speaker",
                  "speakerId": "simon"
                }
              },
              {
                "id": "section-0002-line-0102-alignment",
                "body": {
                  "type": "alignment",
                  "mediaRef": {
                    "resourceId": "media-main"
                  },
                  "interval": {
                    "start": 301.067,
                    "end": 301.901
                  }
                }
              }
            ]
          }
        },
        {
          "type": "text",
          "text": {
            "id": "section-0002-line-0103",
            "content": {
              "text": "眼鏡？",
              "languageId": "zh-Hant",
              "formId": "surface"
            },
            "refs": [
              {
                "id": "section-0002-line-0103-speaker",
                "body": {
                  "type": "speaker",
                  "speakerId": "lan"
                }
              },
              {
                "id": "section-0002-line-0103-alignment",
                "body": {
                  "type": "alignment",
                  "mediaRef": {
                    "resourceId": "media-main"
                  },
                  "interval": {
                    "start": 300.099,
                    "end": 300.9
                  }
                }
              }
            ]
          }
        },
        {
          "type": "text",
          "text": {
            "id": "section-0002-line-0104",
            "content": {
              "text": "JA: 学年。",
              "languageId": "zh-Hant",
              "formId": "surface"
            },
            "refs": [
              {
                "id": "section-0002-line-0104-speaker",
                "body": {
                  "type": "speaker",
                  "speakerId": "simon"
                }
              },
              {
                "id": "section-0002-line-0104-alignment",
                "body": {
                  "type": "alignment",
                  "mediaRef": {
                    "resourceId": "media-main"
                  },
                  "interval": {
                    "start": 302.302,
                    "end": 303.903
                  }
                }
              }
            ],
            "transforms": [
              {
                "id": "section-0002-line-0104-transform-0001",
                "transformType": "translation",
                "output": {
                  "id": "section-0002-line-0104-transform-0001-output",
                  "content": {
                    "text": "學期",
                    "languageId": "zh-Hant",
                    "formId": "surface"
                  }
                }
              },
              {
                "id": "section-0002-line-0104-transform-0002",
                "transformType": "translation",
                "output": {
                  "id": "section-0002-line-0104-transform-0002-output",
                  "content": {
                    "text": "school year",
                    "languageId": "en",
                    "formId": "surface"
                  }
                }
              }
            ]
          }
        },
        {
          "type": "text",
          "text": {
            "id": "section-0002-line-0105",
            "content": {
              "text": "學期。",
              "languageId": "zh-Hant",
              "formId": "surface"
            },
            "refs": [
              {
                "id": "section-0002-line-0105-speaker",
                "body": {
                  "type": "speaker",
                  "speakerId": "lan"
                }
              },
              {
                "id": "section-0002-line-0105-alignment",
                "body": {
                  "type": "alignment",
                  "mediaRef": {
                    "resourceId": "media-main"
                  },
                  "interval": {
                    "start": 305.471,
                    "end": 306.172
                  }
                }
              }
            ]
          }
        },
        {
          "type": "text",
          "text": {
            "id": "section-0002-line-0106",
            "content": {
              "text": "學期,開始新的",
              "languageId": "zh-Hant",
              "formId": "surface"
            },
            "refs": [
              {
                "id": "section-0002-line-0106-speaker",
                "body": {
                  "type": "speaker",
                  "speakerId": "simon"
                }
              },
              {
                "id": "section-0002-line-0106-alignment",
                "body": {
                  "type": "alignment",
                  "mediaRef": {
                    "resourceId": "media-main"
                  },
                  "interval": {
                    "start": 306.506,
                    "end": 310.043
                  }
                }
              }
            ]
          }
        },
        {
          "type": "text",
          "text": {
            "id": "section-0002-line-0107",
            "content": {
              "text": "學期。我開始",
              "languageId": "zh-Hant",
              "formId": "surface"
            },
            "refs": [
              {
                "id": "section-0002-line-0107-speaker",
                "body": {
                  "type": "speaker",
                  "speakerId": "simon"
                }
              },
              {
                "id": "section-0002-line-0107-alignment",
                "body": {
                  "type": "alignment",
                  "mediaRef": {
                    "resourceId": "media-main"
                  },
                  "interval": {
                    "start": 310.009,
                    "end": 312.645
                  }
                }
              }
            ]
          }
        },
        {
          "type": "text",
          "text": {
            "id": "section-0002-line-0108",
            "content": {
              "text": "講課。",
              "languageId": "zh-Hant",
              "formId": "surface"
            },
            "refs": [
              {
                "id": "section-0002-line-0108-speaker",
                "body": {
                  "type": "speaker",
                  "speakerId": "simon"
                }
              },
              {
                "id": "section-0002-line-0108-alignment",
                "body": {
                  "type": "alignment",
                  "mediaRef": {
                    "resourceId": "media-main"
                  },
                  "interval": {
                    "start": 312.945,
                    "end": 314.247
                  }
                }
              }
            ]
          }
        },
        {
          "type": "text",
          "text": {
            "id": "section-0002-line-0109",
            "content": {
              "text": "嗯。",
              "languageId": "zh-Hant",
              "formId": "surface"
            },
            "refs": [
              {
                "id": "section-0002-line-0109-speaker",
                "body": {
                  "type": "speaker",
                  "speakerId": "lan"
                }
              },
              {
                "id": "section-0002-line-0109-alignment",
                "body": {
                  "type": "alignment",
                  "mediaRef": {
                    "resourceId": "media-main"
                  },
                  "interval": {
                    "start": 314.681,
                    "end": 315.782
                  }
                }
              }
            ]
          }
        },
        {
          "type": "text",
          "text": {
            "id": "section-0002-line-0110",
            "content": {
              "text": "然後,我",
              "languageId": "zh-Hant",
              "formId": "surface"
            },
            "refs": [
              {
                "id": "section-0002-line-0110-speaker",
                "body": {
                  "type": "speaker",
                  "speakerId": "simon"
                }
              },
              {
                "id": "section-0002-line-0110-alignment",
                "body": {
                  "type": "alignment",
                  "mediaRef": {
                    "resourceId": "media-main"
                  },
                  "interval": {
                    "start": 316.182,
                    "end": 316.916
                  }
                }
              }
            ]
          }
        },
        {
          "type": "text",
          "text": {
            "id": "section-0002-line-0111",
            "content": {
              "text": "何回も何回も老眼メガネをかけたり取ったりかけたり取ったりかけたり取ったり",
              "languageId": "zh-Hant",
              "formId": "surface"
            },
            "refs": [
              {
                "id": "section-0002-line-0111-speaker",
                "body": {
                  "type": "speaker",
                  "speakerId": "simon"
                }
              },
              {
                "id": "section-0002-line-0111-alignment",
                "body": {
                  "type": "alignment",
                  "mediaRef": {
                    "resourceId": "media-main"
                  },
                  "interval": {
                    "start": 317.35,
                    "end": 323.089
                  }
                }
              }
            ],
            "transforms": [
              {
                "id": "section-0002-line-0111-transform-0001",
                "transformType": "translation",
                "output": {
                  "id": "section-0002-line-0111-transform-0001-output",
                  "content": {
                    "text": "經過和經過,我都把鏡頭）\n老花眼鏡一直戴上拿下、戴上拿下、戴上拿下，來來回回",
                    "languageId": "zh-Hant",
                    "formId": "surface"
                  }
                }
              },
              {
                "id": "section-0002-line-0111-transform-0002",
                "transformType": "translation",
                "output": {
                  "id": "section-0002-line-0111-transform-0002-output",
                  "content": {
                    "text": "I kept having to put my reading glasses on, then take them off, then put them on again, then take them off again",
                    "languageId": "en",
                    "formId": "surface"
                  }
                }
              }
            ]
          }
        },
        {
          "type": "text",
          "text": {
            "id": "section-0002-line-0112",
            "content": {
              "text": "学生をみたいときにとって遠く見える(ため）,だけどパソコンとかノートを見るときにかけないといけない、１００回も...",
              "languageId": "zh-Hant",
              "formId": "surface"
            },
            "refs": [
              {
                "id": "section-0002-line-0112-speaker",
                "body": {
                  "type": "speaker",
                  "speakerId": "simon"
                }
              },
              {
                "id": "section-0002-line-0112-alignment",
                "body": {
                  "type": "alignment",
                  "mediaRef": {
                    "resourceId": "media-main"
                  },
                  "interval": {
                    "start": 323.356,
                    "end": 335.368
                  }
                }
              }
            ],
            "transforms": [
              {
                "id": "section-0002-line-0112-transform-0001",
                "transformType": "translation",
                "output": {
                  "id": "section-0002-line-0112-transform-0001-output",
                  "content": {
                    "text": "看學生的時候，老花眼鏡戴太遠就看不清楚，但看電腦或筆記本的時候又非戴不可，一天得戴上拿下一百次！",
                    "languageId": "zh-Hant",
                    "formId": "surface"
                  }
                }
              },
              {
                "id": "section-0002-line-0112-transform-0002",
                "transformType": "translation",
                "output": {
                  "id": "section-0002-line-0112-transform-0002-output",
                  "content": {
                    "text": "everytime I wanted to be able to see far away, to see the students, I had to take them off, but every time I wanted to look at my computer or my notes, I had to put them on.",
                    "languageId": "en",
                    "formId": "surface"
                  }
                }
              }
            ]
          }
        },
        {
          "type": "text",
          "text": {
            "id": "section-0002-line-0113",
            "content": {
              "text": "怎麼說？",
              "languageId": "zh-Hant",
              "formId": "surface"
            },
            "refs": [
              {
                "id": "section-0002-line-0113-speaker",
                "body": {
                  "type": "speaker",
                  "speakerId": "simon"
                }
              },
              {
                "id": "section-0002-line-0113-alignment",
                "body": {
                  "type": "alignment",
                  "mediaRef": {
                    "resourceId": "media-main"
                  },
                  "interval": {
                    "start": 335.668,
                    "end": 336.769
                  }
                }
              }
            ]
          }
        },
        {
          "type": "text",
          "text": {
            "id": "section-0002-line-0114",
            "content": {
              "text": "你上週",
              "languageId": "zh-Hant",
              "formId": "surface"
            },
            "refs": [
              {
                "id": "section-0002-line-0114-speaker",
                "body": {
                  "type": "speaker",
                  "speakerId": "lan"
                }
              },
              {
                "id": "section-0002-line-0114-alignment",
                "body": {
                  "type": "alignment",
                  "mediaRef": {
                    "resourceId": "media-main"
                  },
                  "interval": {
                    "start": 338.504,
                    "end": 339.772
                  }
                }
              }
            ]
          }
        },
        {
          "type": "text",
          "text": {
            "id": "section-0002-line-0115",
            "content": {
              "text": "上課的時候。",
              "languageId": "zh-Hant",
              "formId": "surface"
            },
            "refs": [
              {
                "id": "section-0002-line-0115-speaker",
                "body": {
                  "type": "speaker",
                  "speakerId": "lan"
                }
              },
              {
                "id": "section-0002-line-0115-alignment",
                "body": {
                  "type": "alignment",
                  "mediaRef": {
                    "resourceId": "media-main"
                  },
                  "interval": {
                    "start": 340.039,
                    "end": 341.074
                  }
                }
              }
            ]
          }
        },
        {
          "type": "text",
          "text": {
            "id": "section-0002-line-0116",
            "content": {
              "text": "你一直",
              "languageId": "zh-Hant",
              "formId": "surface"
            },
            "refs": [
              {
                "id": "section-0002-line-0116-speaker",
                "body": {
                  "type": "speaker",
                  "speakerId": "lan"
                }
              },
              {
                "id": "section-0002-line-0116-alignment",
                "body": {
                  "type": "alignment",
                  "mediaRef": {
                    "resourceId": "media-main"
                  },
                  "interval": {
                    "start": 341.207,
                    "end": 342.208
                  }
                }
              }
            ]
          }
        },
        {
          "type": "text",
          "text": {
            "id": "section-0002-line-0117",
            "content": {
              "text": "把你的老花眼鏡",
              "languageId": "zh-Hant",
              "formId": "surface"
            },
            "refs": [
              {
                "id": "section-0002-line-0117-speaker",
                "body": {
                  "type": "speaker",
                  "speakerId": "lan"
                }
              },
              {
                "id": "section-0002-line-0117-alignment",
                "body": {
                  "type": "alignment",
                  "mediaRef": {
                    "resourceId": "media-main"
                  },
                  "interval": {
                    "start": 342.275,
                    "end": 344.31
                  }
                }
              }
            ]
          }
        },
        {
          "type": "text",
          "text": {
            "id": "section-0002-line-0118",
            "content": {
              "text": "拿下來又戴上去,拿下來又戴上去,",
              "languageId": "zh-Hant",
              "formId": "surface"
            },
            "refs": [
              {
                "id": "section-0002-line-0118-speaker",
                "body": {
                  "type": "speaker",
                  "speakerId": "lan"
                }
              },
              {
                "id": "section-0002-line-0118-alignment",
                "body": {
                  "type": "alignment",
                  "mediaRef": {
                    "resourceId": "media-main"
                  },
                  "interval": {
                    "start": 345.078,
                    "end": 348.314
                  }
                }
              }
            ]
          }
        },
        {
          "type": "text",
          "text": {
            "id": "section-0002-line-0119",
            "content": {
              "text": "一直重複,因為你要看學生的時候,你就要把老花眼鏡拿下來,這樣纔看得清楚遠的地方。",
              "languageId": "zh-Hant",
              "formId": "surface"
            },
            "refs": [
              {
                "id": "section-0002-line-0119-speaker",
                "body": {
                  "type": "speaker",
                  "speakerId": "lan"
                }
              },
              {
                "id": "section-0002-line-0119-alignment",
                "body": {
                  "type": "alignment",
                  "mediaRef": {
                    "resourceId": "media-main"
                  },
                  "interval": {
                    "start": 349.382,
                    "end": 357.223
                  }
                }
              }
            ]
          }
        },
        {
          "type": "text",
          "text": {
            "id": "section-0002-line-0120",
            "content": {
              "text": "然後,但你要看電腦的時候,就要把它帶起來,這樣纔看得清楚近的地方。",
              "languageId": "zh-Hant",
              "formId": "surface"
            },
            "refs": [
              {
                "id": "section-0002-line-0120-speaker",
                "body": {
                  "type": "speaker",
                  "speakerId": "lan"
                }
              },
              {
                "id": "section-0002-line-0120-alignment",
                "body": {
                  "type": "alignment",
                  "mediaRef": {
                    "resourceId": "media-main"
                  },
                  "interval": {
                    "start": 357.757,
                    "end": 363.763
                  }
                }
              }
            ]
          }
        },
        {
          "type": "text",
          "text": {
            "id": "section-0002-line-0121",
            "content": {
              "text": "但反正就這樣子弄了很多次。",
              "languageId": "zh-Hant",
              "formId": "surface"
            },
            "refs": [
              {
                "id": "section-0002-line-0121-speaker",
                "body": {
                  "type": "speaker",
                  "speakerId": "lan"
                }
              },
              {
                "id": "section-0002-line-0121-alignment",
                "body": {
                  "type": "alignment",
                  "mediaRef": {
                    "resourceId": "media-main"
                  },
                  "interval": {
                    "start": 364.063,
                    "end": 367.333
                  }
                }
              }
            ]
          }
        },
        {
          "type": "text",
          "text": {
            "id": "section-0002-line-0122",
            "content": {
              "text": "對,對,對,很多次,很多次。",
              "languageId": "zh-Hant",
              "formId": "surface"
            },
            "refs": [
              {
                "id": "section-0002-line-0122-speaker",
                "body": {
                  "type": "speaker",
                  "speakerId": "simon"
                }
              },
              {
                "id": "section-0002-line-0122-alignment",
                "body": {
                  "type": "alignment",
                  "mediaRef": {
                    "resourceId": "media-main"
                  },
                  "interval": {
                    "start": 367.967,
                    "end": 370.97
                  }
                }
              }
            ]
          }
        },
        {
          "type": "text",
          "text": {
            "id": "section-0002-line-0123",
            "content": {
              "text": "すぐ是什麼說?",
              "languageId": "zh-Hant",
              "formId": "surface"
            },
            "refs": [
              {
                "id": "section-0002-line-0123-speaker",
                "body": {
                  "type": "speaker",
                  "speakerId": "simon"
                }
              },
              {
                "id": "section-0002-line-0123-alignment",
                "body": {
                  "type": "alignment",
                  "mediaRef": {
                    "resourceId": "media-main"
                  },
                  "interval": {
                    "start": 374.107,
                    "end": 376.843
                  }
                }
              }
            ],
            "selectors": [
              {
                "id": "section-0002-line-0123-selector-0001",
                "selectorType": "span",
                "children": [
                  {
                    "id": "section-0002-line-0123-selector-0001-text",
                    "content": {
                      "text": "すぐ",
                      "languageId": "zh-Hant",
                      "formId": "surface"
                    },
                    "source": {
                      "type": "selector",
                      "ranges": [
                        {
                          "start": 0,
                          "end": 2
                        }
                      ]
                    },
                    "transforms": [
                      {
                        "id": "section-0002-line-0123-selector-0001-text-transform-0001",
                        "transformType": "translation",
                        "output": {
                          "id": "section-0002-line-0123-selector-0001-text-transform-0001-output",
                          "content": {
                            "text": "馬上",
                            "languageId": "zh-Hant",
                            "formId": "surface"
                          }
                        }
                      },
                      {
                        "id": "section-0002-line-0123-selector-0001-text-transform-0002",
                        "transformType": "translation",
                        "output": {
                          "id": "section-0002-line-0123-selector-0001-text-transform-0002-output",
                          "content": {
                            "text": "straight away",
                            "languageId": "en",
                            "formId": "surface"
                          }
                        }
                      }
                    ]
                  }
                ]
              }
            ]
          }
        },
        {
          "type": "text",
          "text": {
            "id": "section-0002-line-0124",
            "content": {
              "text": "我すぐ感覺很麻煩。",
              "languageId": "zh-Hant",
              "formId": "surface"
            },
            "refs": [
              {
                "id": "section-0002-line-0124-speaker",
                "body": {
                  "type": "speaker",
                  "speakerId": "simon"
                }
              },
              {
                "id": "section-0002-line-0124-alignment",
                "body": {
                  "type": "alignment",
                  "mediaRef": {
                    "resourceId": "media-main"
                  },
                  "interval": {
                    "start": 377.51,
                    "end": 379.946
                  }
                }
              }
            ],
            "selectors": [
              {
                "id": "section-0002-line-0124-selector-0001",
                "selectorType": "span",
                "children": [
                  {
                    "id": "section-0002-line-0124-selector-0001-text",
                    "content": {
                      "text": "すぐ",
                      "languageId": "zh-Hant",
                      "formId": "surface"
                    },
                    "source": {
                      "type": "selector",
                      "ranges": [
                        {
                          "start": 1,
                          "end": 3
                        }
                      ]
                    },
                    "transforms": [
                      {
                        "id": "section-0002-line-0124-selector-0001-text-transform-0001",
                        "transformType": "translation",
                        "output": {
                          "id": "section-0002-line-0124-selector-0001-text-transform-0001-output",
                          "content": {
                            "text": "馬上",
                            "languageId": "zh-Hant",
                            "formId": "surface"
                          }
                        }
                      },
                      {
                        "id": "section-0002-line-0124-selector-0001-text-transform-0002",
                        "transformType": "translation",
                        "output": {
                          "id": "section-0002-line-0124-selector-0001-text-transform-0002-output",
                          "content": {
                            "text": "straight away",
                            "languageId": "en",
                            "formId": "surface"
                          }
                        }
                      }
                    ]
                  }
                ]
              }
            ]
          }
        },
        {
          "type": "text",
          "text": {
            "id": "section-0002-line-0125",
            "content": {
              "text": "哦,你就很快就覺得很麻煩。",
              "languageId": "zh-Hant",
              "formId": "surface"
            },
            "refs": [
              {
                "id": "section-0002-line-0125-speaker",
                "body": {
                  "type": "speaker",
                  "speakerId": "lan"
                }
              },
              {
                "id": "section-0002-line-0125-alignment",
                "body": {
                  "type": "alignment",
                  "mediaRef": {
                    "resourceId": "media-main"
                  },
                  "interval": {
                    "start": 380.38,
                    "end": 384.317
                  }
                }
              }
            ]
          }
        },
        {
          "type": "text",
          "text": {
            "id": "section-0002-line-0126",
            "content": {
              "text": "🎵🎵🎵MUSIC🎵🎵🎵",
              "languageId": "zxx",
              "formId": "surface"
            },
            "refs": [
              {
                "id": "section-0002-line-0126-alignment",
                "body": {
                  "type": "alignment",
                  "mediaRef": {
                    "resourceId": "media-main"
                  },
                  "interval": {
                    "start": 386.0,
                    "end": 396.0
                  }
                }
              }
            ],
            "source": {
              "type": "external",
              "label": "nonSpeech"
            }
          }
        }
      ]
    }
  ]
} satisfies Document;
