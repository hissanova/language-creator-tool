import assert from "node:assert/strict";
import test from "node:test";
import { findViewerSample, viewerSamples, viewerSampleStaticParams } from "./sampleRegistry";

const existingIds = [
  "viewer-conversation-smoke",
  "decomposition-minimum",
  "decomposition-nested-minimum",
  "conversation-chinese-medium",
];
const newIds = ["lcm-cheat-sheet", "reading-kana", "reading-chinese"];

test("all intended IDs are registered once and existing URLs remain stable", () => {
  const ids = viewerSamples.map(({ id }) => id);
  assert.deepEqual(ids, [...existingIds, ...newIds]);
  assert.equal(new Set(ids).size, ids.length);
});

test("lookup returns the registered entry and rejects unknown IDs", () => {
  for (const sample of viewerSamples) {
    assert.equal(findViewerSample(sample.id), sample);
    assert.ok(sample.label.length > 0);
  }
  assert.equal(findViewerSample("does-not-exist"), undefined);
  assert.equal(findViewerSample("../reading-kana"), undefined);
});

test("static route params contain every registered ID", () => {
  assert.deepEqual(viewerSampleStaticParams(), viewerSamples.map(({ id }) => ({ sampleId: id })));
});

test("every loader resolves to a Core Document", async () => {
  for (const sample of viewerSamples) {
    const document = await sample.load();
    assert.equal(typeof document.metadata.specVersion, "string", sample.id);
    assert.ok(document.metadata.specVersion.length > 0, sample.id);
    assert.equal(typeof document.metadata.title, "string", sample.id);
    assert.ok(Array.isArray(document.sections), sample.id);
  }
});
