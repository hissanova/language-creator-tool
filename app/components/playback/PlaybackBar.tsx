import type { PlaybackController } from "./usePlaybackController";
import { PLAYBACK_RATES, type PlaybackRate } from "./playbackState";
import {
  formatPlaybackTime,
  getLoopRangePercentages,
  getLoopRangeVisualStyle,
  getPlaybackProgressPercentage,
} from "./playbackDisplay";
import { loopButtonClass, toggleButtonClass } from "./playbackButtonStyles";
import { LoopIcon, PauseIcon, PlayIcon, SkipIcon } from "./PlaybackIcons";

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

  return (
    <button
      type="button"
      disabled={disabled}
      aria-label={label}
      title={label}
      onClick={() => onSkip(seconds)}
      className="inline-flex min-w-12 items-center justify-center gap-0.5 rounded-full border px-2 py-2 text-xs font-semibold text-gray-800 hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
    >
      <SkipIcon direction={direction} className="h-4 w-4" />
      <span>{magnitude}s</span>
    </button>
  );
}

export function PlaybackBar({ controller }: { controller: PlaybackController }) {
  const { state, actions, mediaProps } = controller;
  const duration = state.duration != null &&
    Number.isFinite(state.duration) &&
    state.duration > 0
    ? state.duration
    : 0;
  const hasDuration = duration > 0;
  const selected = state.selectedLoopRange;
  const selectedMatchesSource = selected?.mediaSource === state.mediaSource;
  const percentages = selected && selectedMatchesSource
    ? getLoopRangePercentages(selected, state.duration)
    : null;
  const showWholeSourceLoop = state.loopEnabled && !selected;
  const loopVisualStyle = percentages
    ? getLoopRangeVisualStyle(percentages)
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
  const continuousLabel = state.continuous
    ? "Disable continuous playback"
    : "Enable continuous playback";
  const loopLabel = state.loopEnabled ? "Disable loop" : "Enable loop";

  return (
    <div className="space-y-3 text-gray-950">
      <audio {...mediaProps} preload="metadata" />

      <div
        className="flex flex-wrap items-start justify-start gap-3"
        data-playback-controls-layout="left-flow"
      >
        <div
          className="flex max-w-full flex-wrap items-center justify-start gap-1"
          role="group"
          aria-label="Playback transport"
          data-playback-cluster="transport"
        >
          <SkipButton seconds={-10} disabled={skipDisabled} onSkip={actions.skip} />
          <SkipButton seconds={-2} disabled={skipDisabled} onSkip={actions.skip} />
          <button
            type="button"
            onClick={state.playing ? actions.pause : actions.play}
            className="inline-flex min-h-12 min-w-16 items-center justify-center rounded-full border-2 border-blue-700 bg-blue-50 px-5 py-2 text-blue-800 hover:bg-blue-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
            aria-label={playLabel}
            title={playLabel}
          >
            {state.playing ? <PauseIcon /> : <PlayIcon />}
          </button>
          <SkipButton seconds={2} disabled={skipDisabled} onSkip={actions.skip} />
          <SkipButton seconds={10} disabled={skipDisabled} onSkip={actions.skip} />
        </div>

        <div className="flex min-w-0 max-w-full flex-col items-start gap-2" data-playback-cluster="state">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              aria-pressed={state.continuous}
              aria-label={continuousLabel}
              title={continuousLabel}
              data-playback-toggle="continuous"
              data-state={state.continuous ? "on" : "off"}
              onClick={() => actions.setContinuous(!state.continuous)}
              className={toggleButtonClass(state.continuous)}
            >
              Continuous
            </button>
            <button
              type="button"
              aria-pressed={state.loopEnabled}
              aria-label={loopLabel}
              title={loopLabel}
              data-playback-toggle="loop"
              data-state={state.loopEnabled ? "on" : "off"}
              onClick={actions.toggleLoop}
              className={loopButtonClass({ pressed: state.loopEnabled })}
            >
              <LoopIcon />
            </button>
          </div>

          <div className="flex flex-wrap gap-1" role="group" aria-label="Playback speed">
            {PLAYBACK_RATES.map((rate) => {
              const selectedRate = state.playbackRate === rate;
              return (
                <button
                  key={rate}
                  type="button"
                  aria-pressed={selectedRate}
                  aria-label={`Set playback speed to ${rate}×`}
                  onClick={() => actions.setPlaybackRate(rate as PlaybackRate)}
                  className={[
                    "rounded border px-2 py-1 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700",
                    selectedRate
                      ? "border-blue-700 bg-blue-100 text-blue-900 shadow-inner"
                      : "border-gray-300 bg-white text-gray-800 hover:bg-gray-100",
                  ].join(" ")}
                >
                  {rate}×
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div>
        <div
          className="relative h-8 w-full"
          data-playback-timeline="full-source"
        >
          <div
            aria-hidden="true"
            data-track="base"
            className="pointer-events-none absolute inset-x-0 top-1/2 z-0 h-2 -translate-y-1/2 rounded-full bg-gray-300"
          />
          <div
            aria-hidden="true"
            data-track="progress"
            className="pointer-events-none absolute left-0 top-1/2 z-10 h-2 -translate-y-1/2 rounded-full bg-blue-600"
            style={{ width: `${progressPercentage}%` }}
          />
          {(percentages || showWholeSourceLoop) && hasDuration ? (
            <>
              <div
                aria-hidden="true"
                data-loop-range={state.loopEnabled ? "active" : "inactive"}
                data-loop-scope={showWholeSourceLoop ? "full-source" : "selection"}
                data-loop-start={showWholeSourceLoop ? 0 : selected?.start}
                data-loop-end={showWholeSourceLoop ? duration : selected?.end}
                className={[
                  "pointer-events-none absolute top-1/2 z-20 h-3 -translate-y-1/2 rounded-sm border-2",
                  state.loopEnabled
                    ? "border-emerald-800 bg-emerald-300/75"
                    : "border-dashed border-gray-700 bg-gray-200/80",
                ].join(" ")}
                style={showWholeSourceLoop
                  ? { left: "0%", width: "100%" }
                  : loopVisualStyle ?? undefined}
              />
              {!showWholeSourceLoop && percentages ? (
                <>
                  <div
                    aria-hidden="true"
                    data-loop-boundary="start"
                    className={[
                      "pointer-events-none absolute top-1/2 z-20 h-4 w-0.5 -translate-y-1/2",
                      state.loopEnabled ? "bg-emerald-950" : "bg-gray-800",
                    ].join(" ")}
                    style={{ left: `${percentages.start}%` }}
                  />
                  <div
                    aria-hidden="true"
                    data-loop-boundary="end"
                    className={[
                      "pointer-events-none absolute top-1/2 z-20 h-4 w-0.5 -translate-x-full -translate-y-1/2",
                      state.loopEnabled ? "bg-emerald-950" : "bg-gray-800",
                    ].join(" ")}
                    style={{ left: `${percentages.start + percentages.width}%` }}
                  />
                </>
              ) : null}
            </>
          ) : null}
          <input
            type="range"
            aria-label="Seek"
            min={0}
            max={duration}
            step={0.001}
            value={seekValue}
            disabled={!state.mediaSource || !hasDuration}
            onChange={(event) => actions.seek(Number(event.target.value))}
            className="playback-seek-input absolute inset-0 z-30 h-8 w-full cursor-pointer rounded-full bg-transparent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 disabled:cursor-not-allowed"
          />
        </div>
        <div className="flex justify-between gap-3 text-sm tabular-nums text-gray-600">
          <span>{formatPlaybackTime(state.currentTime)}</span>
          <span>{formatPlaybackTime(state.duration)}</span>
        </div>
      </div>

      <div className="flex min-h-7 flex-wrap items-center gap-2 text-sm">
        {selected ? (
          <>
            <span
              data-loop-selection={state.loopEnabled ? "active" : "inactive"}
              className={[
                "rounded border px-2 py-1",
                state.loopEnabled
                  ? "border-emerald-600 bg-emerald-100 text-emerald-900"
                  : "border-dashed border-gray-400 bg-gray-100 text-gray-700",
              ].join(" ")}
            >
              {selected.lineId} — {formatPlaybackTime(selected.start)}–{formatPlaybackTime(selected.end)}
              {!state.loopEnabled ? " (inactive)" : ""}
            </span>
            <button
              type="button"
              aria-label="Clear loop range"
              title="Clear loop range"
              onClick={actions.clearLoopRange}
              className="rounded border px-2 py-1 hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
            >
              ×
            </button>
          </>
        ) : state.loopEnabled ? (
          <span className="rounded border border-emerald-600 bg-emerald-100 px-2 py-1 text-emerald-900">Whole audio</span>
        ) : (
          <span className="text-gray-500">No loop range selected</span>
        )}
      </div>
    </div>
  );
}
