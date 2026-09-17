import assert from "node:assert/strict";
import test from "node:test";
import { handlePlaybackKeyboardShortcut, isEditablePlaybackShortcutTarget, resolvePlaybackKeyboardCommand } from "./playbackKeyboardShortcuts";
import { noop, targetMatching } from "./playbackTestFixtures";

test("global Space and Arrow shortcuts retain shared transport behavior", () => {
  assert.deepEqual(resolvePlaybackKeyboardCommand({
    key: " ", shiftKey: false, ctrlKey: false, metaKey: false, altKey: false,
    repeat: false, defaultPrevented: false,
  }), { type: "toggle" });
  assert.deepEqual(resolvePlaybackKeyboardCommand({
    key: "ArrowRight", shiftKey: true, ctrlKey: false, metaKey: false, altKey: false,
    repeat: false, defaultPrevented: false,
  }), { type: "skip", seconds: 1 });
  let played = 0;
  let prevented = 0;
  assert.equal(handlePlaybackKeyboardShortcut({
    key: " ", shiftKey: false, ctrlKey: false, metaKey: false, altKey: false,
    repeat: false, defaultPrevented: false, target: null,
    preventDefault: () => { prevented += 1; },
  }, {
    playing: false, canToggle: true, canSkip: true,
    play: () => { played += 1; }, pause: noop, skip: noop,
  }), true);
  assert.equal(played, 1);
  assert.equal(prevented, 1);
});


test("Space ignores a focused Lock or editable field and leaves browser defaults untouched", () => {
  for (const selector of ["button", "input", "select", "textarea", "[contenteditable]:not([contenteditable=\"false\"])", "[role=\"textbox\"]", ".monaco-editor"]) {
    let prevented = false;
    let played = false;
    const target = targetMatching(selector);
    assert.equal(isEditablePlaybackShortcutTarget(target), true);
    assert.equal(handlePlaybackKeyboardShortcut({
      key: " ", shiftKey: false, ctrlKey: false, metaKey: false, altKey: false,
      repeat: false, defaultPrevented: false, target,
      preventDefault: () => { prevented = true; },
    }, {
      playing: false, canToggle: true, canSkip: true,
      play: () => { played = true; }, pause: noop, skip: noop,
    }), false);
    assert.equal(prevented, false);
    assert.equal(played, false);
  }
});

test("keyboard shortcuts preserve skip sizes and reject modifiers or repeated Space", () => {
  const base = { shiftKey: false, ctrlKey: false, metaKey: false, altKey: false, repeat: false, defaultPrevented: false };
  for (const [key, shiftKey, seconds] of [
    ["ArrowLeft", false, -5], ["ArrowLeft", true, -1],
    ["ArrowRight", false, 5], ["ArrowRight", true, 1],
  ] as const) {
    assert.deepEqual(resolvePlaybackKeyboardCommand({ ...base, key, shiftKey }), { type: "skip", seconds });
  }
  for (const override of [
    { repeat: true }, { ctrlKey: true }, { metaKey: true },
    { altKey: true }, { shiftKey: true }, { defaultPrevented: true },
  ]) {
    assert.equal(resolvePlaybackKeyboardCommand({ ...base, key: " ", ...override }), null);
  }
  let prevented = 0;
  let played = 0;
  const event = { ...base, key: " ", target: null, preventDefault: () => { prevented += 1; } };
  const playback = { playing: false, canToggle: true, canSkip: true, play: () => { played += 1; }, pause: noop, skip: noop };
  assert.equal(handlePlaybackKeyboardShortcut(event, { ...playback, canToggle: false }), false);
  assert.equal(prevented, 0);
  assert.equal(handlePlaybackKeyboardShortcut(event, playback), true);
  assert.equal(played, 1);
  assert.equal(prevented, 1);
});
