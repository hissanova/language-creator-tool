import type { Theme } from "../ThemeToggle";

export type ViewerId = "conversation" | "text" | "developer";

export type ViewerOption = {
  id: ViewerId;
  label: string;
};

export type ViewerSettingsOwnerProps = {
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
  viewerId: ViewerId;
  viewerOptions: readonly ViewerOption[];
  onViewerChange: (viewerId: ViewerId) => void;
};
