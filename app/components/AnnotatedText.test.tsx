import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { AnnotatedText } from "./AnnotatedText";
import { resolveAnnotatedTextSegments } from "./script-line/resolveAnnotatedTextSegments";

const first = {
  id: "first",
  selector: { selectorType: "range" as const, range: { start: 1, end: 3 } },
};

test("renders plain and annotated segments with the supplied presentation", () => {
  const html = renderToStaticMarkup(
    <AnnotatedText
      segments={resolveAnnotatedTextSegments("abcd", [first])}
      getAnnotationPresentation={() => ({
        title: "meaning",
        className: "annotated",
        style: { color: "red" },
      })}
    />,
  );

  assert.equal(
    html,
    '<span>a</span><span class="annotated" style="color:red" title="meaning">bc</span><span>d</span>',
  );
});

test("preserves the established first-annotation presentation for an identical range", () => {
  const second = { ...first, id: "second" };
  const html = renderToStaticMarkup(
    <AnnotatedText
      segments={resolveAnnotatedTextSegments("abc", [first, second])}
      getAnnotationPresentation={(annotation) => ({ title: annotation.id })}
    />,
  );

  assert.equal(html, '<span>a</span><span title="first">bc</span>');
});

test("preserves the established greedy presentation for crossing ranges", () => {
  const crossing = {
    id: "crossing",
    selector: { selectorType: "range" as const, range: { start: 2, end: 4 } },
  };
  const html = renderToStaticMarkup(
    <AnnotatedText
      segments={resolveAnnotatedTextSegments("abcd", [first, crossing])}
      getAnnotationPresentation={(annotation) => ({ title: annotation.id })}
    />,
  );

  assert.equal(html, '<span>a</span><span title="first">bc</span><span>d</span>');
});
