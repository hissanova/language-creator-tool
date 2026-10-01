"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { AutoFollowMode } from "../auto-follow/autoFollow";
import { AutoFollowControls } from "../auto-follow/AutoFollowControls";
import type { Theme } from "../ThemeToggle";
import { ViewerOptionControls, type ViewerOptionControlsProps } from "./ViewerOptionControls";
import type { ViewerId, ViewerOption } from "./viewerSettingsTypes";
import { MenuIcon } from "../ViewerIcons";

export type ViewerSettingId =
  | "form"
  | "reading"
  | "translation"
  | "auto-follow"
  | "follow-mode"
  | "theme"
  | "viewer";

export type ViewerSettingsDisclosureAction = "toggle" | "close";

export function resolveViewerSettingsOpen(
  open: boolean,
  action: ViewerSettingsDisclosureAction,
) {
  return action === "toggle" ? !open : false;
}

export function shouldCloseViewerSettingsForClick(
  target: Node | null,
  panel: Pick<Node, "contains"> | null,
  launcher: Pick<Node, "contains"> | null,
) {
  return target != null && !panel?.contains(target) && !launcher?.contains(target);
}

export function restoreViewerSettingsLauncherFocus(
  launcher: Pick<HTMLButtonElement, "focus"> | null,
) {
  launcher?.focus();
}

export function getVisibleViewerSettingIds({
  hasForm,
  hasReading,
  hasTranslation,
  hasAutoFollow,
}: {
  hasForm: boolean;
  hasReading: boolean;
  hasTranslation: boolean;
  hasAutoFollow: boolean;
}): ViewerSettingId[] {
  return [
    ...(hasForm ? ["form" as const] : []),
    ...(hasReading ? ["reading" as const] : []),
    ...(hasTranslation ? ["translation" as const] : []),
    ...(hasAutoFollow ? ["auto-follow" as const, "follow-mode" as const] : []),
    "theme",
    "viewer",
  ];
}

export type ViewerSettingsProps = ViewerOptionControlsProps & {
  autoFollowAvailable: boolean;
  autoFollowEnabled: boolean;
  autoFollowMode: AutoFollowMode;
  onAutoFollowEnabledChange: (enabled: boolean) => void;
  onAutoFollowModeChange: (mode: AutoFollowMode) => void;
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
  viewerId: ViewerId;
  viewerOptions: readonly ViewerOption[];
  onViewerChange: (viewerId: ViewerId) => void;
};

export function ViewerSettingsPanel({
  autoFollowAvailable,
  autoFollowEnabled,
  autoFollowMode,
  onAutoFollowEnabledChange,
  onAutoFollowModeChange,
  theme,
  onThemeChange,
  viewerId,
  viewerOptions,
  onViewerChange,
  ...viewerOptionsProps
}: ViewerSettingsProps) {
  const visibleSettingIds = getVisibleViewerSettingIds({
    hasForm: viewerOptionsProps.formOptions.length > 1,
    hasReading: viewerOptionsProps.readingOptions.length > 0,
    hasTranslation: viewerOptionsProps.translationLanguageOptions.length > 0,
    hasAutoFollow: autoFollowAvailable,
  });
  return (
    <div
      className="grid gap-3"
      aria-label="Viewer settings"
      data-visible-settings={visibleSettingIds.join(" ")}
    >
      <ViewerOptionControls {...viewerOptionsProps} />

      {autoFollowAvailable ? (
        <AutoFollowControls
          enabled={autoFollowEnabled}
          mode={autoFollowMode}
          onEnabledChange={onAutoFollowEnabledChange}
          onModeChange={onAutoFollowModeChange}
        />
      ) : null}

      <label className="grid gap-1" data-viewer-setting="theme">
        <span className="text-sm font-medium">Theme</span>
        <select
          aria-label="Theme"
          value={theme}
          onChange={(event) => onThemeChange(event.target.value as Theme)}
          className="viewer-interactive-surface rounded border px-2 py-1"
        >
          <option value="system">System</option>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
      </label>

      <label className="grid gap-1" data-viewer-setting="viewer">
        <span className="text-sm font-medium">Viewer</span>
        <select
          value={viewerId}
          onChange={(event) => onViewerChange(event.target.value as ViewerId)}
          className="viewer-interactive-surface rounded border px-2 py-1"
        >
          {viewerOptions.map((option) => (
            <option key={option.id} value={option.id}>{option.label}</option>
          ))}
        </select>
      </label>
    </div>
  );
}

export function ViewerSettings(props: ViewerSettingsProps) {
  const [open, setOpen] = useState(false);
  const launcherRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;

    const closeAndRestoreFocus = () => {
      setOpen((current) => resolveViewerSettingsOpen(current, "close"));
      restoreViewerSettingsLauncherFocus(launcherRef.current);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeAndRestoreFocus();
    };
    const onClick = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (shouldCloseViewerSettingsForClick(
        target,
        panelRef.current,
        launcherRef.current,
      )) closeAndRestoreFocus();
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("click", onClick);
    };
  }, [open]);

  return (
    <div
      className="pointer-events-none fixed z-50"
      style={{
        right: "max(1rem, calc((100vw - 56rem) / 2 + 1.5rem))",
        top: "max(1rem, env(safe-area-inset-top))",
      }}
    >
      <button
        ref={launcherRef}
        type="button"
        aria-label="Settings"
        aria-expanded={open}
        aria-controls={panelId}
        title="Settings"
        onClick={() => setOpen((current) => resolveViewerSettingsOpen(current, "toggle"))}
        className="viewer-interactive-surface pointer-events-auto ml-auto flex h-11 w-11 min-h-11 min-w-11 items-center justify-center rounded-full border p-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
      >
        <MenuIcon />
      </button>
      {open ? (
        <div
          ref={panelRef}
          id={panelId}
          className="viewer-surface-elevated pointer-events-auto mt-2 w-[min(20rem,calc(100vw-2rem))] overflow-y-auto rounded-xl border p-4"
          style={{ maxHeight: "min(38rem, calc(100vh - 5rem - env(safe-area-inset-bottom)))" }}
        >
          <ViewerSettingsPanel {...props} />
        </div>
      ) : null}
    </div>
  );
}
