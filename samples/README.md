# Samples

Samples are used to keep markup, Core JSON, Display Style, and the viewer implementation aligned.

The registered `.lcm` samples can be compiled into generated Core JSON TypeScript fixtures. See [Compiling LCM to Core JSON Fixtures](../docs/workflow/lcm-compiler.md). Generated files under `samples/core-json/generated/` should not be edited by hand.

## Structure

```text
samples/
  markup/
  core-json/
  display-style/
  display-json/
```

## Pipeline

```text
Markup
  -> Core JSON
  -> Core JSON + displayStyle + glossary autoscan
  -> Viewer
```

## Naming

Use matching base names for related sample files.

```text
samples/markup/basic-conversation.lct
samples/core-json/basic-conversation.json
samples/display-style/basic-viewer.yaml
```
