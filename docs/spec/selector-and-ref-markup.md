# Selector and Ref Markup

Status: Draft

Selectors choose text. Refs attach information to selected text or selector
structure.

In the LCT Core Model, selectors compile to `SelectorNode`s and refs compile to
`Ref`s. Do not model new selector syntax as a separate selection layer, and do
not model refs as transforms.

## Selectors

Selectors choose part of a `TextNode` and may create child `TextNode`s in Core JSON.

Do not call these “Targets” in the new spec. Use “selector” or “selection”.

Selector syntax includes:

```lcm
@line
```

```lcm
@"text"
```

```lcm
@"text"[2]
```

```lcm
@"t1", "t2", ..., "tk"
```

```lcm
@decompose
  t1|t2|...|tk
```

Meanings:

```text
@line
  selects the whole current text line

@"..."
  selects a text span

@"..."[2]
  selects the second occurrence

@"t1", "t2", ..., "tk"
  selects multiple spans as one multi-child selection group

@decompose
  splits one selected text into ordered internal units
```

Text-match syntax, occurrence syntax, comma-separated selection syntax, and decomposition syntax are markup/parser details. Core JSON stores resolved selector results and child text ranges.

In Core JSON, selectors compile to `SelectorNode`s. A selector may create one or more child `TextNode`s.

Conceptually:

```text
parent TextNode
  └ SelectorNode
       ├ child TextNode
       ├ child TextNode
       └ ...
```

---

### Text span selector

```lcm
@"喫到飽"
```

This selects the first matching span `喫到飽` in the current parent `TextNode`.

When the same text appears multiple times, occurrence syntax may be used:

```lcm
@"貿易"[2]
```

This selects the second occurrence of `貿易`.

The occurrence index is part of the markup syntax. Core JSON should store the resolved source range, not the original text-match expression.

---

### Multi-child selection

Some selectors create multiple child `TextNode`s.

There are two common multi-child selector patterns:

```text
1. comma-separated selection
2. decomposition
```

Both create a `SelectorNode` with multiple child `TextNode`s. The difference is the intended relation between the children.

---

### Comma-separated selection

Comma-separated selection groups multiple selected spans under one selector.

Syntax:

```lcm
@"t1", "t2", ..., "tk"
```

Only the first item has `@`. The following comma-separated items belong to the same selector group.

Example:

```lcm
@"寒い"[1], "寒い"[2]
```

This creates one multi-child selector containing two child `TextNode`s, one for each selected occurrence.

Comma-separated selection is useful when multiple spans should be treated together, for example:

* repeated words
* paired expressions
* contrastive expressions
* discontinuous expressions
* source/target correspondence inside one line
* relation annotation between multiple spans

Example:

```lcm
>speaker: 寒いから寒いと言った。

  @"寒い"[1], "寒い"[2]
    +tag:
      repeated-expression
```

This means that the selected pair as a whole is tagged as `repeated-expression`.

In Core JSON, comma-separated selection may compile to a `SelectorNode` such as:

```text
selectorType: "parallel"
```

or another project-defined selector type.

Each child `TextNode` stores its own resolved source range.

Conceptually:

```text
parent TextNode
  └ selectorType: "parallel"
       ├ child TextNode for first selected span
       └ child TextNode for second selected span
```

This does not mean that the selected text is decomposed into internal parts. It means that independent spans are selected and grouped together.

---

### Decomposition selector

Decomposition syntax splits one selected text into ordered internal units.

Syntax:

```lcm
@decompose
  t1|t2|...|tk
```

The units inside `@decompose` do not need quotation marks.

Example:

```lcm
@"喫到飽"
  @decompose
    喫|到|飽
```

This selects `喫到飽` and creates ordered child `TextNode`s for `喫`, `到`, and `飽`.

`@decompose` is not a separate Core Model concept. It compiles to a `SelectorNode` with:

```text
selectorType: "decomposition"
```

Conceptually:

```text
TextNode: 喫到飽
  └ selectorType: "decomposition"
       ├ TextNode: 喫
       ├ TextNode: 到
       └ TextNode: 飽
```

The difference between comma-separated selection and decomposition is:

```text
@"t1", "t2", ..., "tk"
  groups multiple selected spans from the parent text

@decompose
  t1|t2|...|tk
  splits one selected text into internal units
```

Example contrast:

```lcm
@"寒い"[1], "寒い"[2]
```

selects two separate occurrences.

```lcm
@"喫到飽"
  @decompose
    喫|到|飽
```

selects one expression and splits it into internal parts.

---

### Group-level annotations

Refs and transforms written directly under a multi-child selector apply to the selector group as a whole.

Example:

```lcm
>speaker: 寒いから寒いと言った。

  @"寒い"[1], "寒い"[2]
    +tag:
      repeated-expression
```

This attaches the `repeated-expression` tag to the selected pair, not to only one child.

Similarly:

```lcm
@"A", "B"
  +note:
    These two expressions form a contrastive pair.
```

This note describes the relation or grouping between `A` and `B`.

---

### Positional child selectors

Inside a selector block that creates child `TextNode`s, positional selectors may be used to refer to those child `TextNode`s.

Syntax:

```lcm
@1
@2
@3
```

Meaning:

```text
@1
  selects the first child TextNode of the current multi-child selector

@2
  selects the second child TextNode of the current multi-child selector

@k
  selects the k-th child TextNode of the current multi-child selector
```

Example with comma-separated selection:

```lcm
>speaker: 寒いから寒いと言った。

  @"寒い"[1], "寒い"[2]
    +tag:
      repeated-expression

    @1
      +note:
        First occurrence.

    @2
      +note:
        Second occurrence.
```

Here:

```text
+tag
  applies to the whole selected pair

@1 +note
  applies to the first selected child

@2 +note
  applies to the second selected child
```

Example with decomposition:

```lcm
@"喫到飽"
  @decompose
    喫|到|飽

    @1
      +note:
        Verb-like element.

    @2
      +note:
        Result/direction element.

    @3
      +note:
        Full/satisfied element.
```

Here, `@1`, `@2`, and `@3` refer to the decomposition children `喫`, `到`, and `飽`.

---

### Nested selection inside child TextNodes

A positional child selector changes the current selection context.

Inside `@1`, `@2`, or another positional selector, ordinary text selectors such as `@"..."` are resolved inside that child `TextNode`.

Example:

```lcm
@"ほげほげ"[2], "ほげほげ"[5]
  @1
    @"ほげ"[2]
      +note:
        The second ほげ inside the first selected ほげほげ.

  @2
    @"ほげ"[2]
      +note:
        The second ほげ inside the second selected ほげほげ.
```

This distinction is important:

```text
@1, @2, ...
  refer to child TextNodes created by the current multi-child selector

@"..."
  selects text inside the current TextNode context
```

Therefore, use positional selectors to refer to children of a selector group, and use text selectors to select inside those child texts.

---

### Selector scope rules

The following scope rules apply:

1. A selector is resolved against the current `TextNode` context.
2. A multi-child selector creates child `TextNode`s.
3. Refs or transforms written directly under a multi-child selector apply to the selector group as a whole.
4. `@1`, `@2`, ..., `@k` select children of the nearest enclosing multi-child selector.
5. Inside `@1`, `@2`, ..., the current `TextNode` context becomes that selected child.
6. Text selectors inside a positional child selector are resolved against that child `TextNode`.

Example:

```lcm
@"ほげほげ"[2], "ほげほげ"[5]
  +tag:
    paired-expression

  @1
    @"ほげ"[2]
      +note:
        Nested selection inside first child.

  @2
    @"ほげ"[2]
      +note:
        Nested selection inside second child.
```

---

### Separator and whitespace rules for `@decompose`

In `@decompose`, `|` separates units.

```lcm
@decompose
  喫|到|飽
```

Whitespace around `|` is trimmed by default.

```lcm
@decompose
  喫 | 到 | 飽
```

is equivalent to:

```lcm
@decompose
  喫|到|飽
```

If a literal `|` is needed inside a unit, it should be escaped.

```lcm
@decompose
  A\|B|C
```

This represents two units:

```text
A|B
C
```

Exact escaping rules may be further specified by the parser implementation.

## Refs

`+` commands attach information to the selected text or selector.

Common ref syntax includes:

```lcm
+note:
  text
```

```lcm
+tag:
  - tag-a
  - tag-b
```

```lcm
+dictionary:
  ref: dictionary-entry
```

```lcm
+resource:
  resourceId: resource-id
```

Examples:

```lcm
@"はいさい"
  +note:
    首里・那覇では男性的表現。
```

```lcm
@"降とーん"
  +tag:
    - teen-form
    - aspect
```

```lcm
@"供品"
  +dictionary:
    ref: dict:zh:gongpin#sense-1
```

```lcm
@"写真"
  +resource:
    resourceId: image-main
```

These compile to refs, not transforms.

## Translation and Correction

`+translation` and `+correction` are legacy syntax. New LCM should use
`-> translation` and `-> correction`.

Old:

```lcm
@"日本人"
  +translation en:
    Japanese person
```

New:

```lcm
@"日本人"
  -> translation lang:en:
    Japanese person
```

Old:

```lcm
@"法國人"
  +correction:
    法文
```

New:

```lcm
@"法國人"
  -> correction:
    法文
```

## Sound and Non-Speech

Do not model `+sound` as a transform.

Non-speech or sound-representing text should usually be expressed as selected
text with refs or tags:

```lcm
@"コケコッコー"
  +tag:
    - sound
    - onomatopoeia
    - rooster-crow
```

If needed, future selector types may include:

```text
sound
nonSpeech
soundRepresentation
```

Do not add a dedicated Core `SoundBody` for this direction.

Important distinction:

```text
formId describes how the text is written or represented.
tag/ref describes what the selected text means or represents.
```

`"コケコッコー"` is katakana text. It may be tagged as onomatopoeia or
rooster-crow. `onomatopoeia` should not be used as `formId`.
