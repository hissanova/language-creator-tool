"use client";

import { useEffect } from "react";
import type { PlaybackController } from "./usePlaybackController";

export type PlaybackKeyboardCommand =
  | { type: "toggle" }
  | { type: "skip"; seconds: -5 | -1 | 1 | 5 };

type PlaybackKeyboardEvent = Pick<
  KeyboardEvent,
  | "altKey"
  | "ctrlKey"
  | "defaultPrevented"
  | "key"
  | "metaKey"
  | "preventDefault"
  | "repeat"
  | "shiftKey"
  | "target"
>;

type PlaybackKeyboardInput = Omit<PlaybackKeyboardEvent, "preventDefault" | "target">;

type ShortcutTarget = EventTarget & {
  closest?: (selectors: string) => Element | null;
  parentElement?: Element | null;
};

const EDITABLE_TARGET_SELECTOR = [
  "input",
  "textarea",
  "select",
  "button",
  "[contenteditable]:not([contenteditable=\"false\"])",
  "[role=\"textbox\"]",
  ".monaco-editor",
].join(", ");

export function isEditablePlaybackShortcutTarget(target: EventTarget | null): boolean {
  const shortcutTarget = target as ShortcutTarget | null;
  const element = typeof shortcutTarget?.closest === "function"
    ? shortcutTarget
    : shortcutTarget?.parentElement;

  return element?.closest?.(EDITABLE_TARGET_SELECTOR) != null;
}

export function resolvePlaybackKeyboardCommand(
  event: PlaybackKeyboardInput,
): PlaybackKeyboardCommand | null {
  if (
    event.defaultPrevented ||
    event.ctrlKey ||
    event.metaKey ||
    event.altKey
  ) {
    return null;
  }

  if (event.key === " " && !event.shiftKey) {
    return event.repeat ? null : { type: "toggle" };
  }

  if (event.key === "ArrowLeft") {
    return { type: "skip", seconds: event.shiftKey ? -1 : -5 };
  }

  if (event.key === "ArrowRight") {
    return { type: "skip", seconds: event.shiftKey ? 1 : 5 };
  }

  return null;
}

export function handlePlaybackKeyboardShortcut(
  event: PlaybackKeyboardEvent,
  playback: {
    playing: boolean;
    canToggle: boolean;
    canSkip: boolean;
    play: () => void;
    pause: () => void;
    skip: (seconds: number) => void;
  },
): boolean {
  if (isEditablePlaybackShortcutTarget(event.target)) return false;

  const command = resolvePlaybackKeyboardCommand(event);
  if (!command) return false;

  if (command.type === "toggle") {
    if (!playback.canToggle) return false;
    if (playback.playing) playback.pause();
    else playback.play();
  } else {
    if (!playback.canSkip) return false;
    playback.skip(command.seconds);
  }

  event.preventDefault();
  return true;
}

export function usePlaybackKeyboardShortcuts(
  controller: PlaybackController,
  hasPlaybackMedia: boolean,
) {
  const { actions, state } = controller;

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      handlePlaybackKeyboardShortcut(event, {
        playing: state.playing,
        canToggle: hasPlaybackMedia,
        canSkip: state.mediaSource != null && state.duration != null,
        play: actions.play,
        pause: actions.pause,
        skip: actions.skip,
      });
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    actions.pause,
    actions.play,
    actions.skip,
    hasPlaybackMedia,
    state.duration,
    state.mediaSource,
    state.playing,
  ]);
}
