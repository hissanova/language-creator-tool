import assert from "node:assert/strict";
import test from "node:test";
import { conversationSampleChinese1 } from "../../../samples/core-json/generated/conversation-hyq_2026-04-16_xindeyanjing_EDITED-BY-SIMON";
import { normalizeMediaSrc } from "../media/normalizeMediaSrc";
import type { MediaResource } from "../../types/core/document";
import type { TextLine } from "../../types/core/textLine";
import { resolveLinePlaybackRange } from "./linePlayback";

test("media source normalization remains generic and preserves canonical sample paths", () => {
  assert.equal(normalizeMediaSrc("/public/media/example.mp3"), "/media/example.mp3");
  assert.equal(normalizeMediaSrc("@/public/media/example.mp3"), "/media/example.mp3");
  for (const src of [
    "/media/example.mp3",
    "/open-content/resources/example.mp3",
    "https://example.org/example.mp3",
    "blob:https://example.org/resource-id",
    "data:audio/mpeg;base64,AAAA",
  ]) {
    assert.equal(normalizeMediaSrc(src), src);
  }
  const audio = conversationSampleChinese1.resources?.find(
    (resource): resource is MediaResource =>
      resource.type === "media" && resource.mediaType === "audio",
  );
  assert.equal(audio?.src, "/media/audio/hyq_2026-04-16_xindeyanjing.mp3");
  assert.equal(audio && normalizeMediaSrc(audio.src), audio?.src);
});


test("line playback ranges require resolvable media and valid bounded timestamps", () => {
  const audio: MediaResource = {
    id: "audio-1",
    type: "media",
    mediaType: "audio",
    src: "/one.mp3",
  };
  const textLine = (
    interval?: { start: number; end?: number },
    resourceId = "audio-1",
  ): TextLine => ({
    id: "line-1",
    content: { text: "hello", languageId: "en", formId: "surface" },
    textLineRefs: interval ? [{
      id: "alignment-1",
      body: { type: "alignment", mediaRef: { resourceId }, interval },
    }] : undefined,
  });

  assert.deepEqual(resolveLinePlaybackRange(textLine({ start: 1, end: 2 }), [audio], String), {
    type: "line",
    lineId: "line-1",
    mediaResourceId: "audio-1",
    mediaSource: "/one.mp3",
    start: 1,
    end: 2,
  });
  assert.equal(resolveLinePlaybackRange(textLine(), [audio], String), null);
  assert.equal(resolveLinePlaybackRange(textLine({ start: -1, end: 2 }), [audio], String), null);
  assert.equal(resolveLinePlaybackRange(textLine({ start: 2, end: 2 }), [audio], String), null);
  assert.equal(resolveLinePlaybackRange(textLine({ start: 2 }), [audio], String), null);
  assert.equal(resolveLinePlaybackRange(textLine({ start: 1, end: 2 }, "missing"), [audio], String), null);
  assert.equal(resolveLinePlaybackRange(
    textLine({ start: 1, end: 12 }),
    [audio],
    String,
    { mediaSource: "/one.mp3", duration: 10 },
  ), null);
});

