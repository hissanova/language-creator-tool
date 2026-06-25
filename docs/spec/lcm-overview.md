# LCM Overview

Status: Draft

Language Corpus Markup (LCM) is a human-editable markup format for creating
annotated language resources. It is intended for language-learning material,
conversation transcripts, documentation corpora, grammar examples, and other
texts where people need to attach structured information to language data.

LCM is:

* human-editable
* Git-friendly
* viewer-independent
* intended for annotated language resources
* converted into Core JSON
* rendered by one or more viewers

```text
LCM
 ↓
Core JSON
 ↓
Viewer
```

LCM describes content and meaning. Display choices such as colors, fonts, popup
behavior, layout, and interactivity belong to viewer or display style config,
not to LCM itself.

## Core Model

LCM markup compiles into the LCT Core Model:

```text
Document
 ↓
Section
 ↓
SectionBlock
 ↓
TextNode
    ├ refs
    ├ transforms
    └ selectors
          ↓
          child TextNodes
```

A `TextNode` contains formed text: the written text plus the language and form
used to represent it. Selectors choose parts of a `TextNode` and may create
child `TextNode`s. Refs attach information. Transforms create derived
`TextNode`s, such as translations, corrections, lemmas, romanizations, or other
representations.

## Prefix Model

LCM uses three main prefixes:

```text
@  creates selectors or document structure
+  attaches refs
-> creates transforms
```

Examples:

```lcm
# Greeting

>: はいさい。

  @"はいさい"
    +note:
      首里・那覇で使われる挨拶。

    -> translation lang:en:
      Hello.
```

In this example:

* `# Greeting` creates section structure.
* `@"はいさい"` selects a span of text.
* `+note` attaches a ref to the selected span.
* `-> translation` creates a transform output.

## Related Specifications

* [FormedText and transform markup](./formed-text-and-transform.md)
* [Selector and ref markup](./selector-and-ref-markup.md)
* [Section block markup](./section-block-markup.md)
* [Core JSON specification](./core-json.md)
