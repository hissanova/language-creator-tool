import assert from "node:assert/strict";
import test from "node:test";
import { Children, isValidElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ScriptLine } from "../ScriptLine";
import { ConversationScriptLine } from "../script-line/ConversationScriptLine";
import { DeveloperScriptLine } from "../script-line/DeveloperScriptLine";
import { viewerStyle } from "../../styles/viewerStyle";
import { resolveCurrentPlaybackLineId } from "./playbackDisplay";
import { playbackReducer } from "./playbackState";
import { executePlaybackInstructions } from "./playbackMediaAdapter";
import { planLinePlay, planPlayingChange } from "./playbackMediaPlan";
import { handlePlaybackKeyboardShortcut } from "./playbackKeyboardShortcuts";
import { firstRange, secondRange, withMedia, targetMatching } from "./playbackTestFixtures";

type ButtonProps = {
  "aria-label": string;
  onClick: () => void;
  type: string;
  onKeyDown?: unknown;
};

function findButton(node: ReactNode, label: string): ButtonProps | undefined {
  for (const child of Children.toArray(node)) {
    if (!isValidElement<{ children?: ReactNode; playControl?: ReactNode } & Partial<ButtonProps>>(child)) continue;
    if (child.type === "button" && child.props["aria-label"] === label) {
      return child.props as ButtonProps;
    }
    const found = findButton(child.props.children, label) ?? findButton(child.props.playControl, label);
    if (found) return found;
  }
}

for (const Composition of [ConversationScriptLine, DeveloperScriptLine]) {
  test(`${Composition.name}: only the playing current line shows Pause, independent of Lock`, () => {
    for (const playing of [true, false]) {
      for (const playbackEnded of [true, false]) {
        const state = withMedia({ playing, playbackEnded, currentTime: 12, selectedLineRange: secondRange });
        const currentLineId = resolveCurrentPlaybackLineId(state, [firstRange, secondRange]);
        for (const range of [firstRange, secondRange]) {
          const isCurrent = currentLineId === range.lineId;
          const line = Composition({
            textNode: { id: range.lineId, content: { text: "Line", languageId: "en", formId: "written" } },
            speakers: [], formId: "written", selectedReadingFormId: null,
            translationLanguageId: "none", style: viewerStyle,
            playbackRange: range, hasPlaybackTiming: true,
            isCurrentPlaybackLine: isCurrent, isPlaying: state.playing && isCurrent,
            isRangeLocked: state.selectedLineRange === range,
          });
          const html = renderToStaticMarkup(line);
          const expectedPause = playing && !playbackEnded && range === firstRange;
          assert.match(html, new RegExp(`viewer-playback-${expectedPause ? "playing" : "idle"}-surface`));
          assert.doesNotMatch(html, new RegExp(`viewer-playback-${expectedPause ? "idle" : "playing"}-surface`));
          assert.match(html, new RegExp(`aria-label="${expectedPause ? "Pause playback" : "Play from this line"}"`));
          assert.match(html, new RegExp(`title="${expectedPause ? "Pause playback" : "Play from this line"}"`));
          assert.match(html, new RegExp(`data-playback-icon="${expectedPause ? "pause" : "play"}"`));
          assert.doesNotMatch(html, new RegExp(`data-playback-icon="${expectedPause ? "play" : "pause"}"`));
        }
      }
    }
  });

  test(`${Composition.name}: line Pause preserves position and Lock, then Play starts from the line`, () => {
    for (const selectedLineRange of [null, firstRange, secondRange]) {
      for (const activation of ["mouse", "Enter", " "]) {
        let state = withMedia({ playing: true, currentTime: 12, selectedLineRange, rangeEngaged: selectedLineRange === firstRange, loopEnabled: true });
        const pendingPlaybackRef = { current: null };
        let pauses = 0;
        let plays = 0;
        let seeks = 0;
        let mediaTime = state.currentTime;
        const dispatchAndSync = (action: Parameters<typeof playbackReducer>[1]) => {
          state = playbackReducer(state, action);
        };
        const element = {
          get currentTime() { return mediaTime; },
          set currentTime(time: number) { seeks += 1; mediaTime = time; },
          playbackRate: 1,
          pause() {
            pauses += 1;
            executePlaybackInstructions(planPlayingChange(false, null), context);
          },
          play() {
            plays += 1;
            executePlaybackInstructions(planPlayingChange(true, null), context);
            return Promise.resolve();
          },
        } as HTMLMediaElement;
        const context = { element, pendingPlaybackRef, dispatchAndSync };
        const renderLine = () => Composition({
          textNode: { id: firstRange.lineId, content: { text: "Line", languageId: "en", formId: "written" } },
          speakers: [], formId: "written", selectedReadingFormId: null,
          translationLanguageId: "none", style: viewerStyle,
          playbackRange: firstRange, hasPlaybackTiming: true,
          isCurrentPlaybackLine: resolveCurrentPlaybackLineId(state, [firstRange, secondRange]) === firstRange.lineId,
          isPlaying: state.playing && resolveCurrentPlaybackLineId(state, [firstRange, secondRange]) === firstRange.lineId,
          isRangeLocked: state.selectedLineRange === firstRange,
          onPause: () => element.pause(),
          onPlayLine: (range) => executePlaybackInstructions(planLinePlay(state, range), context),
        });
        const before = state;
        const pauseButton = findButton(ScriptLine(renderLine().props), "Pause playback");
        assert.ok(pauseButton);
        assert.equal(pauseButton.type, "button");
        assert.equal(pauseButton.onKeyDown, undefined);
        if (activation !== "mouse") {
          // Native buttons own Enter/Space activation; the global shortcut must
          // leave the event alone so it cannot perform a second playback action.
          assert.equal(handlePlaybackKeyboardShortcut({
            key: activation, shiftKey: false, ctrlKey: false, metaKey: false, altKey: false,
            repeat: false, defaultPrevented: false, target: targetMatching("button"),
            preventDefault: () => assert.fail("Native activation was prevented"),
          }, {
            playing: true, canToggle: true, canSkip: true,
            pause: () => assert.fail("Global Pause intercepted a line button"),
            play: () => assert.fail("Global Play intercepted a line button"),
            skip: () => assert.fail("Global Skip intercepted a line button"),
          }), false);
        }
        // Mouse and native keyboard activation both dispatch the button click.
        pauseButton.onClick();
        assert.equal(pauses, 1);
        assert.equal(plays, 0);
        assert.equal(seeks, 0);
        assert.equal(element.currentTime, 12);
        assert.deepEqual(state, { ...before, playing: false });
        assert.equal(state.selectedLineRange, selectedLineRange);
        const pausedLine = renderLine();
        assert.match(renderToStaticMarkup(pausedLine), /data-playback-icon="play"/);
        const playButton = findButton(ScriptLine(pausedLine.props), "Play from this line");
        assert.ok(playButton);
        playButton.onClick();
        assert.equal(plays, 1);
        assert.equal(element.currentTime, firstRange.start);
        assert.equal(state.currentTime, firstRange.start);
        assert.equal(state.playing, true);
        assert.match(renderToStaticMarkup(renderLine()), /data-playback-icon="pause"/);
      }
    }
  });
}
