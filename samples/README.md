# Samples

Samples are used to keep markup, Core JSON, Display Style, Display JSON, and the viewer implementation aligned.

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
  -> Core JSON + displayStyle.yaml
  -> Display JSON
  -> Viewer
```

## Naming

Use matching base names for related sample files.

```text
samples/markup/basic-conversation.lct
samples/core-json/basic-conversation.json
samples/display-style/basic-viewer.yaml
samples/display-json/basic-conversation.basic-viewer.json
```
