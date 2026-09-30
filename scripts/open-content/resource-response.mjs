/**
 * Plan the byte interval and status for one resource response.
 *
 * Unsupported range units and multiple ranges are deliberately ignored, so
 * callers serve the complete representation. A malformed single byte range is
 * rejected rather than being reinterpreted as a different valid range.
 *
 * @param {string | null} rangeHeader
 * @param {number} size
 * @returns {{ status: 200 | 206 | 416, start: number, end: number, contentLength: number, contentRange?: string }}
 */
export function planResourceResponse(rangeHeader, size) {
  if (!Number.isSafeInteger(size) || size < 0) {
    throw new TypeError("Resource size must be a non-negative safe integer");
  }

  const full = {
    status: /** @type {const} */ (200),
    start: 0,
    end: Math.max(0, size - 1),
    contentLength: size,
  };
  if (rangeHeader == null) return full;

  const unitMatch = /^\s*([^=\s]+)=(.*)\s*$/.exec(rangeHeader);
  if (!unitMatch) return unsatisfiable(size);
  if (unitMatch[1].toLowerCase() !== "bytes") return full;
  const rangeValue = unitMatch[2].trim();
  if (rangeValue.includes(",")) return full;

  const rangeMatch = /^(\d*)-(\d*)$/.exec(rangeValue);
  if (!rangeMatch || (!rangeMatch[1] && !rangeMatch[2]) || size === 0) {
    return unsatisfiable(size);
  }

  const fullSize = BigInt(size);
  let start;
  let end;
  if (!rangeMatch[1]) {
    const suffixLength = BigInt(rangeMatch[2]);
    if (suffixLength === 0n) return unsatisfiable(size);
    start = suffixLength >= fullSize ? 0n : fullSize - suffixLength;
    end = fullSize - 1n;
  } else {
    start = BigInt(rangeMatch[1]);
    if (start >= fullSize) return unsatisfiable(size);
    end = rangeMatch[2] ? BigInt(rangeMatch[2]) : fullSize - 1n;
    if (end < start) return unsatisfiable(size);
    if (end >= fullSize) end = fullSize - 1n;
  }

  const numericStart = Number(start);
  const numericEnd = Number(end);
  return {
    status: 206,
    start: numericStart,
    end: numericEnd,
    contentLength: numericEnd - numericStart + 1,
    contentRange: `bytes ${numericStart}-${numericEnd}/${size}`,
  };
}

function unsatisfiable(size) {
  return {
    status: /** @type {const} */ (416),
    start: 0,
    end: 0,
    contentLength: 0,
    contentRange: `bytes */${size}`,
  };
}
