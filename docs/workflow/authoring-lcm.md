# Authoring LCM Content

This guide is for content creators who write `.lcm` files and inspect them in
an LCT Viewer. It explains what compilation does, how to tell whether a feature
is supported, and what to do when the current compiler cannot represent a
content need.

For the command used to open an external teaching-materials folder, see
[Opening an external content project](open-external-content.md).

## The basic idea

An `.lcm` file is a human-editable source document. The Viewer does not directly
interpret every piece of text that someone might write in that file.

```text
LCM source written by a creator
  -> LCM compiler
  -> Core JSON understood by LCT
  -> Viewer
```

The **compiler** reads supported LCM syntax and converts it into **Core JSON**.
Core JSON gives LCT a stable, structured representation of sections, text,
speakers, timing, translations, notes, tags, and other annotations.

Compilation is necessary because a compact authoring notation such as:

```lcm
@line
  -> translation lang:en:
    Hello
```

must become an explicit structured mapping before different Viewers and tools
can use it consistently.

## What “supported” means

A feature is supported only when the current compiler recognizes its syntax and
creates the intended Core JSON meaning. If visible behavior is required, the
Viewer must support that Core JSON as well.

Writing proposed syntax in an `.lcm` file does **not** make the feature
supported.

Unsupported text can behave in two ways:

1. The compiler recognizes that the construct is invalid and stops with an
   error.
2. The text occurs somewhere the compiler treats as content, so compilation
   succeeds but the text becomes ordinary dialogue instead of an annotation.

The second case is easy to misread. “The file compiles and opens” does not prove
that every apparent annotation in the file was understood. Use only documented
syntax in content that should have structured meaning.

## Current creator-oriented support

The table below summarizes common authoring needs. The detailed, implementation-
oriented list is in [Compiling LCM to Core JSON fixtures](lcm-compiler.md#supported-lcm-subset).

| Need | Current status | What to do |
| --- | --- | --- |
| Document metadata used by current samples | Supported | Put it in front matter as shown in the cheat sheet |
| Audio resource used for line alignment | Supported | Declare the media resource in front matter |
| Level-1 section | Supported | Use `# Section title` |
| Timestamped speaker or plain-text line | Supported | Use the documented timestamp and line forms |
| Whole-line translation | Supported | Use `@line` with `-> translation lang:<id>:` |
| Tag | Supported | Use `+tag:` with one or more list items |
| Editorial note | Supported | Use `+note:` |
| Translation or gloss for selected text | Supported with current selector limits | Use an exact quoted-text selector |
| Non-speech labels such as music or sound | Supported by convention | Use an agreed source label; LCT does not standardize the label categories yet |
| Recording date metadata | Not currently supported | Open or follow a compiler-extension Issue |
| Timestamp attached directly to a section | Not currently supported | Open or follow a compiler-extension Issue |
| Line-level image, URL, or dictionary ref syntax | Not currently supported | Do not place proposed syntax in dialogue text |

The executable reference is
[`samples/markup/lcm-cheat-sheet.lcm`](../../samples/markup/lcm-cheat-sheet.lcm).
It is compiled in the project check suite, so its examples must remain aligned
with the compiler.

## Daily authoring loop

For an external content project:

1. Update the LCT application separately when you want the latest stable
   version.
2. Start LCT with the external content folder.
3. Edit an `.lcm` file in your editor.
4. Reload the Viewer page. LCT compiles the file again on demand.
5. If compilation fails, use the file name and line number in the error message
   to locate the unsupported or invalid construct.
6. Confirm that annotations appear with the intended meaning, not merely that
   the page opens.

The exact setup and commands are documented in
[Opening an external content project](open-external-content.md).

## Before requesting a new compiler feature

First describe the content-creation problem rather than inventing final syntax.
Answer these questions:

1. What are you trying to achieve?
2. What happens with the current LCM and Viewer?
3. Can existing lines, labels, tags, notes, or mappings represent it?
4. If there is a workaround, what practical problem does it cause?
5. How often does the need occur, and is it likely to affect other projects?
6. Does the compiler or Viewer need to distinguish this information
   mechanically?
7. What is the smallest real example that demonstrates the need?

The maintainer can then classify the request as one of:

- **Already supported** — use an existing documented construct.
- **Documentation needed** — the feature works but is hard to discover.
- **Supported by convention** — existing generic constructs are sufficient;
  agree on how to use them consistently.
- **Compiler extension needed** — LCM needs new syntax and Core JSON meaning.
- **Viewer extension needed** — Core JSON already has the meaning, but the
  Viewer does not present it as needed.
- **Deferred** — the value is understood, but another workflow is more urgent.

## How a compiler extension becomes supported

When a real compiler extension is needed, it normally moves through these
stages:

```text
Creator use case
  -> Core JSON representation
  -> LCM syntax decision
  -> compiler implementation
  -> fixture and semantic checks
  -> Viewer support when needed
  -> documentation
  -> supported
```

Until these stages are complete, proposed syntax belongs in an Issue or RFC,
not in production dialogue and not in the executable cheat sheet.

## Example: handling non-speech content by convention

A project may need to identify intro music, a clock sound, or another
non-speech interval. LCT can already associate a timed line with a source label.
If the compiler and Viewer do not need special filtering, presentation, or
export behavior, a project-level label such as `music` or `sound` may be enough.

LCT does not currently define a universal taxonomy of music, sound effects,
environmental sound, and other physical sound sources. Dedicated syntax should
be reconsidered only when multiple workflows need LCT to interpret those
categories mechanically.
