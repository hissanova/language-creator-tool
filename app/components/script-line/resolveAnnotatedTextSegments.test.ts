import assert from "node:assert/strict";
import test from "node:test";
import type { Selector } from "../../types/core/textLine";
import { resolveAnnotatedTextSegments } from "./resolveAnnotatedTextSegments";

type TestAnnotation = {
  id: string;
  selector: Selector;
};

function range(id: string, start: number, end: number): TestAnnotation {
  return {
    id,
    selector: { selectorType: "range", range: { start, end } },
  };
}

function positions(id: string, values: number[]): TestAnnotation {
  return {
    id,
    selector: { selectorType: "positions", positions: values },
  };
}

function resolve(text: string, annotations: readonly TestAnnotation[]) {
  const segments = resolveAnnotatedTextSegments(text, annotations);
  assert.equal(
    segments.map((segment) => segment.text).join(""),
    text,
    "resolved segments must reproduce the source text exactly",
  );
  return segments.map((segment) => ({
    start: segment.start,
    end: segment.end,
    text: segment.text,
    annotations: segment.annotations.map((annotation) => annotation.id),
  }));
}

test("keeps unannotated text as one segment", () => {
  assert.deepEqual(resolve("plain", []), [
    { start: 0, end: 5, text: "plain", annotations: [] },
  ]);
  assert.deepEqual(resolve("", []), []);
});

test("resolves whole, leading, trailing, and middle ranges", () => {
  assert.deepEqual(resolve("abcde", [range("whole", 0, 5)]), [
    { start: 0, end: 5, text: "abcde", annotations: ["whole"] },
  ]);

  assert.deepEqual(resolve("abcde", [range("leading", 0, 2)]), [
    { start: 0, end: 2, text: "ab", annotations: ["leading"] },
    { start: 2, end: 5, text: "cde", annotations: [] },
  ]);

  assert.deepEqual(resolve("abcde", [range("trailing", 3, 5)]), [
    { start: 0, end: 3, text: "abc", annotations: [] },
    { start: 3, end: 5, text: "de", annotations: ["trailing"] },
  ]);

  assert.deepEqual(resolve("abcde", [range("middle", 1, 4)]), [
    { start: 0, end: 1, text: "a", annotations: [] },
    { start: 1, end: 4, text: "bcd", annotations: ["middle"] },
    { start: 4, end: 5, text: "e", annotations: [] },
  ]);
});

test("keeps adjacent ranges separate", () => {
  assert.deepEqual(resolve("中文测试", [range("left", 0, 2), range("right", 2, 4)]), [
    { start: 0, end: 2, text: "中文", annotations: ["left"] },
    { start: 2, end: 4, text: "测试", annotations: ["right"] },
  ]);
});

test("associates identical, nested, and overlapping annotations with every active segment", () => {
  assert.deepEqual(
    resolve("ABCDE", [
      range("same-second", 1, 4),
      range("inner", 2, 3),
      range("outer", 0, 5),
      range("same-first", 1, 4),
      range("overlap", 3, 5),
    ]),
    [
      { start: 0, end: 1, text: "A", annotations: ["outer"] },
      {
        start: 1,
        end: 2,
        text: "B",
        annotations: ["outer", "same-second", "same-first"],
      },
      {
        start: 2,
        end: 3,
        text: "C",
        annotations: ["outer", "same-second", "same-first", "inner"],
      },
      {
        start: 3,
        end: 4,
        text: "D",
        annotations: ["outer", "same-second", "same-first", "overlap"],
      },
      { start: 4, end: 5, text: "E", annotations: ["outer", "overlap"] },
    ],
  );
});

test("uses JavaScript UTF-16 offsets for non-ASCII text", () => {
  assert.equal("A😀中".length, 4);
  assert.deepEqual(resolve("A😀中", [range("emoji", 1, 3)]), [
    { start: 0, end: 1, text: "A", annotations: [] },
    { start: 1, end: 3, text: "😀", annotations: ["emoji"] },
    { start: 3, end: 4, text: "中", annotations: [] },
  ]);
});

test("ignores selectors that the existing viewer cannot resolve", () => {
  assert.deepEqual(
    resolve("abc", [
      range("empty", 1, 1),
      range("negative", -1, 1),
      range("reversed", 2, 1),
      range("past-end", 1, 4),
      positions("positions", [0, 2]),
    ]),
    [{ start: 0, end: 3, text: "abc", annotations: [] }],
  );
});
