import type { SVGProps } from "react";

type IconProps = Omit<SVGProps<SVGSVGElement>, "children">;

function IconFrame({ children, ...props }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

export function PlayIcon(props: IconProps) {
  return (
    <IconFrame data-playback-icon="play" fill="currentColor" stroke="none" {...props}>
      <path d="M8 5v14l11-7z" />
    </IconFrame>
  );
}

export function PauseIcon(props: IconProps) {
  return (
    <IconFrame data-playback-icon="pause" {...props}>
      <path d="M9 5v14M15 5v14" />
    </IconFrame>
  );
}

export function LoopIcon(props: IconProps) {
  return (
    <IconFrame data-playback-icon="loop" {...props}>
      <path d="M17 2l3 3-3 3" />
      <path d="M3 11V9a4 4 0 014-4h13" />
      <path d="M7 22l-3-3 3-3" />
      <path d="M21 13v2a4 4 0 01-4 4H4" />
    </IconFrame>
  );
}

export function SkipIcon({ direction, ...props }: IconProps & { direction: "backward" | "forward" }) {
  return (
    <IconFrame data-playback-icon={`skip-${direction}`} {...props}>
      {direction === "backward" ? (
        <>
          <path d="M11 7l-5 5 5 5" />
          <path d="M18 7l-5 5 5 5" />
        </>
      ) : (
        <>
          <path d="M6 7l5 5-5 5" />
          <path d="M13 7l5 5-5 5" />
        </>
      )}
    </IconFrame>
  );
}
