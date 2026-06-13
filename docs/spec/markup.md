Language Corpus Markup Specification
Version: 0.3-alpha
Status: Draft

# 1. Overview
Language Corpus Markup (LCM) is a human-editable markup format for creating annotated language resources.
The format supports:
- language learning materials
- corpus annotation
- dictionary building
- subtitle preparation
- text-only corpora
- audio/video corpora
The format is designed to be:
- human readable
- Git friendly
- easy to parse
- easy to edit manually
- suitable for GUI editing

# 2. Design Philosophy
The format separates:
- document structure
- annotation
- dictionary knowledge
- media alignment

The core model is:

Document
 ↓
Section
 ↓
Line
 ↓
Target
    ├ Annotation
    ├ Resource
    └ Decomposition
         └ Target

- Annotations describe Targets.
- Resources provide supplementary content for Targets.
- Decompositions define structural relationships between Targets.
- Dictionary entries are external resources.
- Media is optional.
- The data model is target-centered.
- Tier-like views are viewer projections derived from annotations and decompositions.

# 3. Core Data Model
## 3.1 Document
A Document is the top-level object.
A Document consists of:
- Metadata
- Body

Document type is specified in metadata.

Examples of document types:
- conversation
- interview
- story
- subtitle project
- example collection
- grammar study

## 3.2 Metadata
Metadata contains document-level configuration.
Example:
```
---
title: Matsu Conversation 01

documentType: conversation

targetLanguage: zh-Hant

textVariants:
  - zh-Hant
  - zh-Hans

translationLanguages:
  - ja
  - en

formTypes:
  - kana
  - pinyin
  - zhuyin
  - phoneme
  - ipa

speakers:

  - id: ran
    name: Ran

  - id: ten
    name: Ten

dictionarySources:

  - id: local-dictionary
    type: json
    path: dictionaries/zh.json

  - id: popup-dictionary
    type: extension

dictionaryAutoScan:

  defaultSources:
    - local-dictionary

media:
  src: interview01.mp4
  type: video

specVersion: 0.3
---
```

## 3.3 Media
Media is optional.
Media-based document:
```
media:
  src: interview01.mp4
  type: video
```
Text-only document:
```
media: null
```
Both are valid.

## 3.4 Body
The Body contains Sections.

## 3.5 Section
Sections use Markdown headings.
Heading levels define nesting.
Examples:
```
# [00:00] Greeting

## [01:20] Taiwan

### [02:10] Weather
```
A Section MUST contain:
title
startTime
A Section MAY contain:
endTime

## 3.6 Line
A Section contains Lines.
A Line is the basic transcript unit.
Line Timing
Time-aligned lines use SRT-style timing blocks.
Example:
```
[00:01:12.000 --> 00:01:14.500]
>simon: 我有
```
If timing is present:
startTime is required
endTime is required
Speaker Syntax
Examples:
```
>ran: 哈嘍

>ten: 好久不見

>kanaa: 雨ぬ降てーん

Speaker inheritance:
>simon: 我有

>: 一次

>: 我去

>: 喫到飽
```
A line beginning with:
```
>: ...
```
inherits the speaker from the most recent line with an explicit speaker.
Special speakers MAY be used:
```
>sound: typing

>music: intro theme

>narrator: 昔々あるところに...
```

## 3.7 Target
A Target represents the object being annotated.
Supported target types:
Section
Line
Text Span
Examples:
```
>speaker1: はいさい。ちゅーうがなびら。
  @line
    …
```
```
>speaker1: はいさい。ちゅーうがなびら。
  @"はいさい"
     …
```
A Target MUST belong to exactly one Section or Line.
A Target MAY contain timing information.
Examples:
```
>simon: 因為在臺灣已經很熱了
  @"熱"
    …
```
or
```
>simon: 因為在臺灣已經很熱了
  @"熱" [00:01:32.100 --> 00:01:33.400]
    …
```
Target Disambiguation
When the same text appears multiple times, implementations MAY support:
```
>: 寒いから寒いと言った
  @"寒い"[2]
    …
```
or
```
>: 寒いから寒いと言った
  @[4:6]
    …
```
Exact syntax is TBD.

## 3.8 Annotation
Annotations describe the meaning, interpretation, or properties of a Target.
Annotations MUST belong to a Target.
Annotations MUST NOT contain timing information.
Timing belongs only to:
Section
Line
Target
Annotation Categories
Lexical Annotations
```
>simon: 供品很多
  @"供品"
    @dictionary:
      ref: dict:zh:gongpin#sense-1
```
Translation Annotations
```
>simon: 因為在臺灣已經很熱了
  @"熱"
    @translation ja:
      暑い
```
Form Annotations
```
>hisa: 首里んかいいちゃびたん。
  @"首里"
    @form kana:
      しゅり
```
Editorial Annotations
```
>simon: teh book
  @"teh"
    @correction:
      the
```

```
>hisa: はいさい。
  @"はいさい"
    @note:
      首里・那覇では男性的表現。
```
Classification Annotations
```
>: 雨ぬ降とーん。
  @"降とーん"
    @tag:
      - -ooN-form
      - aspect
```
Language Annotations
```
>simon: 中文では「寒い」も使います
  @"寒い"
    @language:
      ja
```
Sound Annotations
```
>ran: typing
  @"typing"
    @sound:
      keyboard typing
```
Additional annotation types MAY be introduced in future versions.

## 3.9 Resource
Resources provide supplementary content associated with a Target.
Resources MUST belong to a Target.
Resources MUST NOT contain timing information.
Examples:
```
>simon: サーフィンでお腹の上に横になって、駄目だった！
  @line
    @resource image:
      src: surfing-paddling-surfboard.jpg
```

```
>hisa: 首里んかいいちゃびたん。
  @"首里"
    @resource url:
      href: https://example.com/shuri
```
Resource Types
image
audio
video
url

## 3.10 Decomposition
Decomposition defines structural relationships between Targets.
Decomposition is NOT an Annotation.
Decomposition creates child Targets.
Example:
```
>simon: 我喜歡喫到飽
  @"喫到飽"
    @decompose:
      喫|到|飽
      @"喫"
        @translation ja:
          食べる
      @"到"
        @dictionary:
          pos: resultative marker
      @"飽"
        @translation ja:
          満腹
```
A decomposition MAY itself contain Targets with additional decompositions.

# 4. Timing Model
Timing MAY be attached only to:
Section
Line
Target
Annotations MUST NOT contain timing.
Resources MUST NOT contain timing.
Decompositions MUST NOT contain timing.
Valid:
```
>simon: 因為在臺灣已經很熱了
  @"熱" [00:01:32.100 --> 00:01:33.400]
    @translation ja:
      暑い
```
Invalid:
```
>simon: 因為在臺灣已經很熱了
  @"熱"
    @translation ja [00:01:32.100 --> 00:01:33.400]:
      暑い
```

# 5. Dictionary Integration
## 5.1 Dictionary Sources
Dictionary sources are configured in Metadata.
Sources MAY include:
local JSON dictionaries
browser extension dictionaries
online dictionaries
APIs
Example:
Inside metadata section, you can write as:
```
dictionarySources:

  - id: local
    type: json

  - id: popup
    type: extension

  - id: wiktionary
    type: api
```

## 5.2 Dictionary References
Targets MAY reference dictionary entries.
Example:
```
>simon: 供品很多

  @"供品"

    @dictionary:
      ref: dict:zh:gongpin#sense-1
```
References SHOULD point to a specific sense whenever possible.

## 5.3 Inline Dictionary Information
Dictionary information MAY be written directly.
Example:
```
>simon: 供品很多

  @"供品"

    @dictionary:
      headword: 供品

      pos: noun

      meanings:
        ja: お供え物
        en: offering
```
If both ref and inline fields are present, inline fields override referenced information.

## 5.4 Automatic Dictionary Scan
A viewer MAY automatically search configured dictionary sources.
Automatic lookup MUST have lower priority than explicit dictionary annotations.

# 6. Popup Meaning Resolution Priority
Viewers SHOULD resolve meanings using:
Explicit dictionary fields
Dictionary references
Automatic dictionary scan

# 7. Translation
Translation provides language-specific rendering.
Translation MAY target:
Section
Line
Text Span
Examples:
```
>simon: 因為在臺灣已經很熱了

  @line

    @translation ja:
      台湾ではもう暑かった

>simon: 因為在臺灣已經很熱了

  @"熱"

    @translation ja:
      暑い

    @translation en:
      hot
```

# 8. Form Annotation
Forms represent alternative representations of the same linguistic content.
Examples include:
kana
pinyin
zhuyin
romanization
phoneme
ipa
Example:
```
>hisa: 首里んかいいちゃびたん。

  @"首里"

    @form kana:
      しゅり
```
A form MAY contain nested decompositions.
Okinawan Example:
```
>: 雨ぬ降とーん。

  @line

    @form kana:
      あみぬふとーん。

      @decompose:
        あみ|ぬ|ふとーん

        @"あみ"

          @dictionary:
            ref: dict:uch:ami#sense-1

        @"ぬ"

          @dictionary:
            pos: particle

        @"ふとーん"

          @form phoneme:
            hutooN

            @decompose:
              hut|ooN

              @"hut"

                @dictionary:
                  ref: dict:uch:furu#stem

              @"ooN"

                @dictionary:
                  category: aspect
                  subtype: resultative/progressive
```

# 9. Language Annotation
Language information is represented using:
```
>simon: 中文では「寒い」も使います

  @"寒い"

    @language:
      ja
```
This replaces dedicated Non-Target-Language syntax.

# 10. Correction
Corrections specify preferred or corrected forms.
Example:
```
>simon: teh book

  @"teh"

    @correction:
      the
```
Corrections indicate that the original form is considered erroneous, non-standard, or less preferred in the current context.

# 11. Tags
Tags provide classification metadata.
Tags are intended for:
searching
filtering
corpus building
grammar studies
teaching material selection
Example:
```
>: 雨ぬ降とーん。

  @"降とーん"

    @tag:
      - teen-form
      - aspect
      - teaching-material
```

```
>hoge: 雨ぬ止むん。
  @”止むん”
    @tag unnatural
    @note “昔は 「雨ぬ晴りゆん」が、普通。”
```
A viewer MAY provide tag-based navigation and search.

12. Non-Linguistic Sounds
Two styles are supported.
Inline sound:
```
>ran: 因為在臺灣已經很熱了 typing

  @"typing"

    @sound:
      keyboard typing
```
Sound line:
```
>sound: typing

  @line

    @sound:
      keyboard typing
```

# 13. ELAN Compatibility
LCM uses a target-centered data model.
ELAN compatibility is achieved through viewer projections and import/export mappings.
## 13.1 Tier-like Views
Tier-like views are derived viewer projections.
The canonical model remains target-centered.
Example:
```
>simon: 我喜歡喫到飽

  @"喫到飽"

    @translation ja:
      食べ放題
```
Viewer projections:
Translation Tier

Dictionary Tier

Grammar Tier

Sound Tier

This provides functionality similar to ELAN while preserving a simpler storage model.
## 13.2 Export / Import Projection
TBA

# 14. Future Extensions
Potential future annotations:
@grammar
@morphology
@lemma
@pos
@variant

# 15. Open Questions
Dictionary data structure specification
Dictionary entry vs sense model
Dictionary plugin architecture
Standardized special speakers
Custom annotation types
Dictionary creation workflow inside the editor
Tier projection rules for each annotation type
Form metadata structure
Resource schema specification
Resource viewer behavior
Resource export/import rules
Target disambiguation syntax
EBNF grammar specification
ELAN import/export mapping
Nested form representation rules


