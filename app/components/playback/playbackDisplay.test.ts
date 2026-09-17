import assert from "node:assert/strict";
import test from "node:test";
import { formatPlaybackTime, getPlaybackProgressPercentage, getPlaybackRangePercentages, getPlaybackRangeVisualStyle, resolveCurrentPlaybackLineId } from "./playbackDisplay";
import { firstRange, secondRange, withMedia } from "./playbackTestFixtures";

test("current-line highlighting and auto-follow remain independent of Lock selection", () => {
  const playing = withMedia({
    playing: true,
    currentTime: 12,
    selectedLineRange: secondRange,
  });
  assert.equal(resolveCurrentPlaybackLineId(playing, [firstRange, secondRange]), "line-1");
  assert.equal(resolveCurrentPlaybackLineId({ ...playing, currentTime: 21 }, [firstRange, secondRange]), "line-2");
  assert.equal(resolveCurrentPlaybackLineId({ ...playing, playbackEnded: true }, [firstRange, secondRange]), null);
});


test("time and progress helpers retain safe behavior", () => {
  assert.equal(formatPlaybackTime(65.123), "1:05.123");
  assert.equal(formatPlaybackTime(null), "--:--.---");
  assert.deepEqual(getPlaybackRangePercentages(firstRange, 20), { start: 50, width: 25 });
  assert.equal(getPlaybackRangePercentages(firstRange, null), null);
  assert.equal(getPlaybackProgressPercentage(40, 30), 100);
  assert.deepEqual(getPlaybackRangeVisualStyle({ start: 99, width: 0.1 }), {
    left: "min(99%, calc(100% - max(0.1%, 5px)))",
    width: "max(0.1%, 5px)",
  });
});
