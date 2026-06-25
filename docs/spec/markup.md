# LCM Markup Specification

Status: Draft

The current LCM markup specification is split into modular documents:

* [LCM overview](./lcm-overview.md)
* [FormedText and transform markup](./formed-text-and-transform.md)
* [Selector and ref markup](./selector-and-ref-markup.md)
* [Section block markup](./section-block-markup.md)

The older monolithic draft is preserved for migration reference at
[legacy/markup-v0.4-alpha-mvp.md](./legacy/markup-v0.4-alpha-mvp.md).

New work should use the modular LCT Core Model-oriented specification. In that
model, `@` creates selectors or document structure, `+` attaches refs, and `->`
creates transforms.
