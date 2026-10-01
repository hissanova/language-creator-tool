import type { PlaybackController } from "./usePlaybackController";
import { PLAYBACK_RATES, type PlaybackRate } from "./playbackState";
import {
  formatPlaybackDuration,
  formatPlaybackTime,
  getPlaybackRangePercentages,
  getPlaybackRangeVisualStyle,
  getPlaybackProgressPercentage,
} from "./playbackDisplay";
import { releasePlaybackButtonFocusOnPointerUp } from "./playbackButtonFocus";
import { LoopIcon, PauseIcon, PlayIcon, SkipIcon } from "./PlaybackIcons";

// Firefox supports autocomplete on buttons and otherwise persists a dynamic
// disabled state across reloads. React's button typings do not expose it.
const disableFirefoxControlStateRestoration = { autoComplete: "off" } as const;

function SkipButton({
  seconds,
  disabled,
  onSkip,
}: {
  seconds: -10 | -2 | 2 | 10;
  disabled: boolean;
  onSkip: (seconds: number) => void;
}) {
  const direction = seconds < 0 ? "backward" : "forward";
  const magnitude = Math.abs(seconds);
  const label = `Skip ${direction} ${magnitude} seconds`;
  const icon = (
    <SkipIcon
      direction={direction}
      chevronCount={magnitude === 2 ? 1 : 2}
      className="h-4 w-4 shrink-0"
    />
  );
  const secondsLabel = (
    <span className="text-xs font-semibold leading-none">{magnitude}s</span>
  );

  return (
    <button
      type="button"
      {...disableFirefoxControlStateRestoration}
      disabled={disabled}
      aria-label={label}
      title={label}
      data-skip-seconds={seconds}
      onClick={() => onSkip(seconds)}
      onPointerUp={releasePlaybackButtonFocusOnPointerUp}
      className="inline-flex h-11 min-h-11 min-w-14 items-center justify-center rounded-full border-0 bg-transparent p-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
    >
      <span className="viewer-interactive-surface inline-flex h-9 w-full items-center justify-center gap-1 rounded-full border px-2">
        {direction === "backward" ? <>{icon}{secondsLabel}</> : <>{secondsLabel}{icon}</>}
      </span>
    </button>
  );
}

export function PlaybackBar({
  controller,
  onSeekIntent,
}: {
  controller: PlaybackController;
  onSeekIntent?: () => void;
}) {
  const { state, actions, mediaProps } = controller;
  const duration = state.duration != null &&
    Number.isFinite(state.duration) &&
    state.duration > 0
    ? state.duration
    : 0;
  const hasDuration = duration > 0;
  const selected = state.selectedLineRange;
  const selectedMatchesSource = selected?.mediaSource === state.mediaSource;
  const percentages = selected && selectedMatchesSource
    ? getPlaybackRangePercentages(selected, state.duration)
    : null;
  const showWholeSourceLoop = state.loopEnabled && !selected;
  const rangeVisualStyle = percentages
    ? getPlaybackRangeVisualStyle(percentages)
    : null;
  const progressPercentage = getPlaybackProgressPercentage(
    state.currentTime,
    state.duration,
  );
  const seekValue = hasDuration && Number.isFinite(state.currentTime)
    ? Math.max(0, Math.min(state.currentTime, duration))
    : 0;
  const skipDisabled = !state.mediaSource || !hasDuration;
  const playLabel = state.playing ? "Pause media" : "Play media";
  const loopScope = selected ? "selected-line" : "whole-source";
  const loopLabel = `${state.loopEnabled ? "Disable" : "Enable"} ${loopScope} loop`;

  return (
    <div className="space-y-1">
      <audio {...mediaProps} preload="metadata" />

      <div
        className="flex min-h-11 flex-wrap items-center gap-x-2 gap-y-1"
        data-playback-row="timeline"
      >
        <span
          data-playback-time="current"
          className="viewer-muted-text shrink-0 text-sm tabular-nums"
        >
          {formatPlaybackDuration(state.currentTime)}
        </span>
        <div
          className="relative h-11 min-w-40 flex-1 basis-40"
          data-playback-timeline="full-source"
        >
          <div aria-hidden="true" data-track="base" className="pointer-events-none absolute inset-x-0 top-1/2 z-0 h-2 -translate-y-1/2 rounded-full bg-gray-300" />
          <div aria-hidden="true" data-track="progress" className="pointer-events-none absolute left-0 top-1/2 z-10 h-2 -translate-y-1/2 rounded-full bg-blue-600" style={{ width: `${progressPercentage}%` }} />
          {(percentages || showWholeSourceLoop) && hasDuration ? (
            <>
              <div
                aria-hidden="true"
                data-playback-boundary={showWholeSourceLoop ? "source-loop" : state.loopEnabled ? "selected-range-loop" : "selected-range"}
                data-boundary-scope={showWholeSourceLoop ? "full-source" : "line"}
                data-boundary-start={showWholeSourceLoop ? 0 : selected?.start}
                data-boundary-end={showWholeSourceLoop ? duration : selected?.end}
                className={["pointer-events-none absolute top-1/2 z-20 h-3 -translate-y-1/2 rounded-sm border-2", selected && !state.loopEnabled ? "border-blue-800 bg-blue-300/75 dark:border-blue-300 dark:bg-blue-700/70" : "border-emerald-800 bg-emerald-300/75 dark:border-emerald-300 dark:bg-emerald-700/70"].join(" ")}
                style={showWholeSourceLoop ? { left: "0%", width: "100%" } : rangeVisualStyle ?? undefined}
              />
              {!showWholeSourceLoop && percentages ? (
                <>
                  <div aria-hidden="true" data-line-boundary="start" className={["pointer-events-none absolute top-1/2 z-20 h-4 w-0.5 -translate-y-1/2", state.loopEnabled ? "bg-emerald-950 dark:bg-emerald-200" : "bg-blue-950 dark:bg-blue-200"].join(" ")} style={{ left: `${percentages.start}%` }} />
                  <div aria-hidden="true" data-line-boundary="end" className={["pointer-events-none absolute top-1/2 z-20 h-4 w-0.5 -translate-x-full -translate-y-1/2", state.loopEnabled ? "bg-emerald-950 dark:bg-emerald-200" : "bg-blue-950 dark:bg-blue-200"].join(" ")} style={{ left: `${percentages.start + percentages.width}%` }} />
                </>
              ) : null}
            </>
          ) : null}
          <input
            type="range"
            autoComplete="off"
            aria-label="Seek"
            min={0}
            max={duration}
            step={0.001}
            value={seekValue}
            disabled={!state.mediaSource || !hasDuration}
            onChange={(event) => { actions.seek(Number(event.target.value)); onSeekIntent?.(); }}
            className="playback-seek-input absolute inset-0 z-30 h-11 w-full cursor-pointer rounded-full bg-transparent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 disabled:cursor-not-allowed"
          />
        </div>
        <span
          data-playback-time="duration"
          className="viewer-muted-text shrink-0 text-sm tabular-nums"
        >
          {formatPlaybackDuration(state.duration)}
        </span>
        {selected ? (
          <span
            data-line-selection="locked"
            data-loop-enabled={state.loopEnabled}
            aria-label={`Selected range from ${formatPlaybackTime(selected.start)} to ${formatPlaybackTime(selected.end)}`}
            className="sr-only"
          >
            Selected range {formatPlaybackTime(selected.start)}–{formatPlaybackTime(selected.end)}
          </span>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-1.5" role="group" aria-label="Playback controls" data-playback-row="controls">
        <div className="flex flex-wrap items-center justify-center gap-0" data-playback-cluster="transport">
            <SkipButton seconds={-10} disabled={skipDisabled} onSkip={actions.skip} />
            <SkipButton seconds={-2} disabled={skipDisabled} onSkip={actions.skip} />
            <button
              type="button"
              onClick={state.playing ? actions.pause : actions.play}
              onPointerUp={releasePlaybackButtonFocusOnPointerUp}
              className="inline-flex h-11 min-h-11 min-w-14 items-center justify-center rounded-full border-0 bg-transparent p-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
              aria-label={playLabel}
              title={playLabel}
            >
              <span className="viewer-primary-surface inline-flex h-9 w-full items-center justify-center rounded-full border-2 px-3">
                {state.playing ? <PauseIcon /> : <PlayIcon />}
              </span>
            </button>
            <SkipButton seconds={2} disabled={skipDisabled} onSkip={actions.skip} />
            <SkipButton seconds={10} disabled={skipDisabled} onSkip={actions.skip} />
        </div>
        <button
          type="button"
          aria-pressed={state.loopEnabled}
          aria-label={loopLabel}
          title={loopLabel}
          data-playback-toggle="loop"
          data-loop-scope={loopScope}
          data-state={state.loopEnabled ? "on" : "off"}
          onClick={actions.toggleLoop}
          onPointerUp={releasePlaybackButtonFocusOnPointerUp}
          className="inline-flex h-11 min-h-11 min-w-14 items-center justify-center rounded-full border-0 bg-transparent p-1 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
        >
          <span className={`${state.loopEnabled ? "viewer-loop-surface shadow-inner" : "viewer-interactive-surface"} inline-flex h-9 w-full items-center justify-center rounded-full border-2 px-3`}>
            <LoopIcon />
          </span>
        </button>
        <div className="flex flex-wrap justify-center gap-0" aria-label="Playback speed" data-playback-cluster="speed">
            {PLAYBACK_RATES.map((rate) => {
              const selectedRate = state.playbackRate === rate;
              return (
                <button
                  key={rate}
                  type="button"
                  aria-pressed={selectedRate}
                  aria-label={`Set playback speed to ${rate}×`}
                  onClick={() => actions.setPlaybackRate(rate as PlaybackRate)}
                  onPointerUp={releasePlaybackButtonFocusOnPointerUp}
                  className={[
                    "inline-flex h-11 min-h-11 items-center justify-center rounded border-0 bg-transparent p-1 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700",
                  ].join(" ")}
                >
                  <span className={`${selectedRate ? "viewer-selected-surface shadow-inner" : "viewer-interactive-surface"} inline-flex h-9 items-center justify-center rounded border px-2`}>
                    {rate}×
                  </span>
                </button>
              );
            })}
        </div>
      </div>
    </div>
  );
}
