import type { PointerEvent as ReactPointerEvent } from "react";

export function releasePlaybackButtonFocusOnPointerUp(
  event: Pick<ReactPointerEvent<HTMLButtonElement>, "currentTarget">,
) {
  event.currentTarget.blur();
}
