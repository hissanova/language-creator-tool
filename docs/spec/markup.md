# Language Corpus Markup (LCM)

Version: 0.4-alpha-mvp
Status: Draft

---

# 1. Overview

Language Corpus Markup (LCM) is a human-editable markup language for creating annotated language resources.

LCM is intended for:

* Language learning content
* Conversation transcripts
* Language documentation
* Grammar study materials
* Dictionary-linked content
* Subtitle preparation
* Audio-aligned corpora

LCM is not a display format.

LCM documents are converted into Core JSON and then rendered by one or more viewers.

```text
LCM
 ↓
Core JSON
 ↓
Viewer
```

Examples of viewers:

* Chinese Conversation Viewer
* Okinawan Corpus Viewer
* Grammar Study Viewer
* Subtitle Viewer

---

# 2. Design Philosophy

LCM is designed around the following principles.

## Human-readable

A linguist, teacher, learner, or community member should be able to read and edit the source file directly.

## Git-friendly

LCM should work well with Git and version control.

## Viewer-independent

LCM describes content.

LCM does not prescribe:

* colors
* popup behavior
* layout
* fonts
* viewer interaction

These belong to Viewer Style configuration.

## Target-centered

Annotations are attached to targets.

Rather than maintaining many separate tiers, LCM stores information around the text being discussed.

## Extensible

Different language communities may use different subsets of the language.

Examples:

* Chinese conversation lessons
* Okinawan example collections
* Classical Japanese materials

---

# 3. User-facing Conceptual Model

This section describes how users should think about LCM.

The internal Core JSON representation is described later.

```text
Document
 ↓
Section
 ↓
Line
 ↓
Target
    ├ Annotation
    ├ Transform
    ├ Resource
    └ Decomposition
```

---

## 3.1 Document

A Document is the top-level object.

Examples:

* Chinese lesson
* Okinawan example collection
* Grammar notes
* Interview transcript

A document contains:

* metadata
* sections

---

## 3.2 Section

Sections organize content.

Example:

```text
# Introduction

## New Eyes

## Feeling Dizzy
```

Sections may be nested.

Sections are used for:

* navigation
* grouping
* playback ranges

---

## 3.3 Line

A Line is the basic transcript unit.

Example:

```text
>simon: 我有一次去喫到飽
```

A line may contain:

* speaker
* timing
* annotations
* targets

---

## 3.4 Target

A Target specifies the part of text being discussed.

Examples:

```text
@"喫到飽"
```

```text
@"降とーん"
```

```text
@line
```

Targets may represent:

* a whole line
* a text span
* a decomposition unit

---

## 3.5 Annotation

Annotations add information.

Examples:

```text
+translation
+dictionary
+note
+correction
+tag
+language
+sound
```

Annotations describe a target.

---

## 3.6 Transform

Transforms create another representation of the same linguistic content.

Examples:

```text
surface
↓
kana
```

```text
surface
↓
phoneme
```

```text
surface
↓
translation
```

Examples:

```text
@transform kana:
  しゅり
```

```text
@transform phoneme:
  hutooN
```

---

## 3.7 Resource

Resources attach supplementary content.

Examples:

```text
@resource image:
```

```text
@resource url:
```

```text
@resource audio:
```

---

## 3.8 Decomposition

Decomposition describes internal structure.

Example:

```text
喫到飽
↓
喫 | 到 | 飽
```

Decomposition units may themselves contain:

* annotations
* transforms
* decompositions

---

# 4. Basic Syntax

LCM uses two prefixes.

```text
@ = structure

+ = annotation
```

Examples:

```text
@"喫到飽"

  +translation ja:
    食べ放題
```

```text
@"法國人"

  +tag:
    unnatural

  +correction:
    法文
```

---

# 5. Metadata

Metadata appears at the beginning of the document.

Example:

```yaml
---
title: 新的眼睛

documentType: conversation

defaultLanguageId: zh-Hant

media:
  src: audio.mp3

dictionarySources:
  - simon-custom

specVersion: 0.4-alpha
---
```

Metadata fields are profile-dependent.

The MVP specification does not require a complete metadata schema.

---

# 6. Sections

Sections use Markdown headings.

Example:

```text
# [00:00] INTRO

## [01:09] 新的眼睛

## [06:36] 頭很暈
```

Heading level determines nesting level.

---

# 7. Lines

Timed lines:

```text
00:01:12.000 --> 00:01:14.500
>simon: 我有
```

Untimed lines:

```text
>simon: 我有
```

Speaker inheritance:

```text
>simon: 我有

>: 一次

>: 我去

>: 喫到飽
```

The inherited lines use the previous speaker.

---

# 8. Targets

## Entire line

```text
@line
```

Example:

```text
>simon: 我有一次去喫到飽

  @line

    +translation ja:
      一度食べ放題に行った
```

---

## Text span

```text
@"喫到飽"
```

Example:

```text
>simon: 我有一次去喫到飽

  @"喫到飽"

    +translation ja:
      食べ放題
```

---

## Repeated text

When the same text appears multiple times:

```text
@"貿易"[2]
```

Example:

```text
>lan: 就是貿易,貿易

  @"貿易"[2]

    +language:
      ja
```

---

# 9. Structure Commands (@)

## @line

Targets the entire current line.

---

## @"..."

Targets a text span.

---

## @transform

Creates another form representation.

Example:

```text
@"首里"

  @transform kana:
    しゅり
```

Example:

```text
@"ふとーん"

  @transform phoneme:
    hutooN
```

---

## @decompose

Creates structural sub-units.

Example:

```text
@"喫到飽"

  @decompose:
    喫|到|飽
```

---

## @resource

Attaches supplementary resources.

Example:

```text
@resource image:
  src: resources/surfing.jpg
```

---

# 10. Annotation Commands (+)

## +translation

Example:

```text
@"日本人"

  +translation en:
    Japanese person
```

---

## +dictionary

Reference form:

```text
@"供品"

  +dictionary:
    ref: dict:zh:gongpin#sense-1
```

---

## +correction

Example:

```text
@"法國人"

  +correction:
    法文
```

---

## +note

Example:

```text
@"はいさい"

  +note:
    首里・那覇では男性的表現。
```

---

## +tag

Example:

```text
@"降とーん"

  +tag:
    - teen-form
    - aspect
```

Project-specific classifications should use tags.

Preferred:

```text
+tag:
  unnatural
```

Avoid:

```text
+unnatural
```

---

## +language

Example:

```text
@"寒い"

  +language:
    ja
```

Language annotations may be created automatically.

---

## +sound

Example:

```text
@line

  +sound:
    keyboard typing
```

---

# 11. Timing Model

Timing may belong to:

* Section
* Line
* Target

Annotations must not contain timing.

Valid:

```text
@"熱" [00:01:32.100 --> 00:01:33.400]

  +translation ja:
    暑い
```

Invalid:

```text
@"熱"

  +translation ja [00:01:32.100 --> 00:01:33.400]:
    暑い
```

---

# 12. Dictionary Integration

Dictionary sources are external.

Example:

```yaml
dictionarySources:
  - simon-custom
  - ninjal-okinawan
```

Dictionary information may be added manually.

Example:

```text
@"供品"

  +dictionary:
    ref: dict:zh:gongpin#sense-1
```

Dictionary information may also be generated automatically.

Priority:

```text
1. Manual dictionary annotation
2. Dictionary reference
3. Automatic dictionary scan
```

---

# 13. Viewer Projection

LCM does not define presentation.

Viewer Style determines:

* popup contents
* translation placement
* transform placement
* decomposition visibility

Example:

```yaml
popup:
  - dictionary
  - note

belowLine:
  - translation

dropdown:
  - decomposition
```

---

# 14. Core JSON Mapping

This section is informational.

LCM users do not need to understand Core JSON.

A typical implementation may use:

```text
Document
 ↓
Section
 ↓
SectionBlock
 ↓
TextNode
 ↓
SelectorNode
    ├ Ref
    └ Transform
```

Conceptual mapping:

| LCM Concept | Core JSON Concept |
| ----------- | ----------------- |
| Document    | Document          |
| Section     | Section           |
| Line        | TextNode          |
| Target      | SelectorNode      |
| Annotation  | Ref / Transform   |
| Transform   | Transform         |
| Resource    | Resource          |

For MVP purposes:

```text
+translation
+correction
```

compile to Transforms.

```text
+note
+tag
+dictionary
+language
+sound
```

compile to Refs.

---

# 15. Profiles

## Chinese Conversation Profile

Recommended features:

```text
@line
@"..."
+translation
+note
+correction
+tag
```

Dictionary auto-scan is strongly recommended.

---

## Okinawan Corpus Profile

Additional features:

```text
@transform kana
@transform phoneme
@decompose
+dictionary
```

---

## Grammar Study Profile

Additional features:

```text
@decompose
+tag
+note
```

---

# 16. Examples

## Chinese Conversation

```text
00:01:24.000 --> 00:01:26.000
>simon: 聽我?

  @"聽我"

    +tag:
      unnatural
```

```text
00:01:36.000 --> 00:01:38.000
>simon: 日本人の皆さん！

  @"日本人の皆さん"

    +language:
      ja

    +translation zh-Hant:
      大家日本人
```

---

## Okinawan Grammar Study

```text
>: 雨ぬ降とーん。

  @line

    @transform kana:
      あみぬふとーん。

      @decompose:
        あみ|ぬ|ふとーん
```

---

## Classical Japanese

```text
>text: 月日は百代の過客にして

  @"過客"

    +translation ja:
      旅人
```

---

# 17. Out of Scope (MVP)

The following topics are intentionally deferred.

* Complete metadata schema
* Dictionary schema
* Viewer Style schema
* Resource schema
* Evidence model
* Git history model
* EAF import/export
* TextGrid import/export
* Editor specification
* Dictionary editor specification
* Alignment editor specification
* Plugin architecture

These topics will be addressed in future specifications.
