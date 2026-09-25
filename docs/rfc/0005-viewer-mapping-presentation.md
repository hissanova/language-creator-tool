# RFC 0005: Viewer Mapping Presentation Resolution

Status: Draft

## Context

Core `TextLine` mappings describe relationships and mapped text. A future Viewer renderer needs a deterministic decision about which mappings can be placed beside canonical source text. That decision belongs to the Viewer and must not change Core JSON or AnnotationPanel configuration.

## Decision

The Viewer accepts an explicit list of mapping presentation rules. Each rule filters mapping type and mapped text language/form by exact string equality. Omitted and `any` filters accept any value; empty filters accept none. Explicit form-ID arrays retain exact matching. A rule selects `alignedText` or `ruby`, `above` or `below`, and an optional order.

A pure resolver collects top-level selected-text, whole-line, local selection, and single-selector selection mappings. It uses the existing annotated-text selector-range helper against `textLine.content.text`. It does not traverse mapping images or project canonical offsets onto a selected alternative form.

Exactly one matching rule yields an item. Zero matches, multiple matches, and unsupported sources yield typed fallbacks. Multiple matches are a conflict, not multiple presentations. Duplicate mapping IDs are collected once, at their first direct occurrence. Within each placement, items sort by source start, source end, rule order, candidate order, then mapping ID. Fallbacks retain candidate order.

Mapping resolution receives the current base Form and Reading selections as explicit context. The symbolic `currentForm` filter matches only the selected base form. The symbolic `currentReading` filter matches only the selected reading form and matches nothing when Reading is `None`. The two selections are independent, even when the same form ID is available for both purposes.

The Viewer defaults to one `reading` rule that places `alignedText` above the source and filters its mapped text with `currentReading`. It therefore presents at most the selected reading form instead of presenting every reading mapping at once. Callers may supply their own rules through the Viewer prop. Rules may also filter by `sourceKinds` (`selector` or `wholeLine`); an omitted filter accepts both, while an empty filter accepts neither.

The aligned layout groups identical selector ranges and preserves the resolver's order within each above or below stack. Partially overlapping or nested non-identical selector ranges all fall back as `overlapping-ranges`; their source text remains intact. Whole-line mappings occupy separate text-area rows above or below the primary line. They do not conflict with selector ranges. The layout ignores `ruby` items, which remain for #15.

The shared ScriptLine model resolves mapping presentation once for both modes. Conversation uses canonical offsets only while displaying canonical text; an alternative whole-line form keeps the existing display path. Developer always displays canonical text. A whole-line translation presented by a rule is omitted from the derived legacy translation list by mapping ID, leaving Core mappings and AnnotationPanel data unchanged.

The Viewer exposes separate controls for base Form and Reading. Base Form options consist of canonical source forms and forms targeted by supported whole-line display mappings; a form is not included merely because it is declared in `metadata.forms`. Reading options come from the target forms of `reading` mappings and use labels from the form registry when available. Reading starts at `None`, which is represented internally by `null` and means that no reading aid is selected. `None` is not a form ID.

`reading` is the Core mapping relationship. Values such as `pinyin` and `zhuyin` are reading form IDs. `alignedText` is the current presentation renderer, while `ruby` remains a separate possible presentation mechanism; neither renderer name is exposed as a selectable content form.

## Trade-off

The first occurrence of a repeated mapping ID determines its source. Core IDs are intended to identify mappings uniquely; inconsistent duplicate IDs therefore remain a content issue. A selection with multiple selectors cannot be represented as one continuous inline range and falls back explicitly.

The initial aligned unit stays unbroken internally. Adjacent units and surrounding source chunks can wrap in normal document flow. Nested alignment and HTML ruby require separate design work.
