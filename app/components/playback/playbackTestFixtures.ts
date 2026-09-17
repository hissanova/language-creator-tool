import type { PlaybackState, LinePlaybackRange } from "./playbackState";
import { initialPlaybackState } from "./playbackState";
export const firstRange: LinePlaybackRange = { type: "line", lineId: "line-1", mediaResourceId: "audio-1", mediaSource: "/one.mp3", start: 10, end: 15 };
export const secondRange: LinePlaybackRange = { ...firstRange, lineId: "line-2", start: 20, end: 25 };
export const otherSourceRange: LinePlaybackRange = { ...firstRange, lineId: "line-other", mediaResourceId: "audio-2", mediaSource: "/two.mp3" };
export function withMedia(overrides: Partial<PlaybackState> = {}): PlaybackState { return { ...initialPlaybackState, mediaResourceId: "audio-1", mediaSource: "/one.mp3", duration: 30, ...overrides }; }
export const noop = () => undefined;
export function targetMatching(editableSelector: string): EventTarget { const target = { closest: (selectors: string) => selectors.split(", ").includes(editableSelector) ? target as unknown as Element : null }; return target as unknown as EventTarget; }
