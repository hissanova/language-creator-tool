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

export function SkipIcon({
  direction,
  chevronCount = 2,
  ...props
}: IconProps & {
  direction: "backward" | "forward";
  chevronCount?: 1 | 2;
}) {
  const paths = direction === "backward"
    ? chevronCount === 1
      ? ["M15 7l-5 5 5 5"]
      : ["M11 7l-5 5 5 5", "M18 7l-5 5 5 5"]
    : chevronCount === 1
      ? ["M9 7l5 5-5 5"]
      : ["M6 7l5 5-5 5", "M13 7l5 5-5 5"];

  return (
    <IconFrame data-playback-icon={`skip-${direction}`} {...props}>
      {paths.map((path) => <path key={path} d={path} />)}
    </IconFrame>
  );
}
