import assert from "node:assert/strict";
import { parseAndNormalizeContent } from "../src/blog/content";
import { clampImageWidth } from "../src/blog/editor-controls";
import { resolveFeaturedImagePath } from "../src/blog/featured-image";

const imageSrc = "/api/uploads/123e4567-e89b-42d3-a456-426614174000.png";
const controlled = {
  type: "doc",
  content: [
    { type: "paragraph", content: [{ type: "text", text: "Colored", marks: [{ type: "textStyle", attrs: { color: "#285f9e" } }] }] },
    { type: "image", attrs: { src: imageSrc, alt: "Example", title: null, width: 58 } },
  ],
};
assert.deepEqual(parseAndNormalizeContent(JSON.stringify(controlled)), controlled);

const legacy = parseAndNormalizeContent(JSON.stringify({ type: "doc", content: [{ type: "image", attrs: { src: imageSrc, displaySize: "medium" } }] }));
assert.equal(((legacy.content as Record<string, unknown>[])[0].attrs as Record<string, unknown>).width, 50);
const withoutWidth = parseAndNormalizeContent(JSON.stringify({ type: "doc", content: [{ type: "image", attrs: { src: imageSrc } }] }));
assert.equal(((withoutWidth.content as Record<string, unknown>[])[0].attrs as Record<string, unknown>).width, 100);

const stripped = parseAndNormalizeContent(JSON.stringify({ type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Unsafe", marks: [{ type: "bold" }, { type: "textStyle", attrs: { color: "expression(alert(1))" } }] }] }] }));
assert.deepEqual(stripped, { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Unsafe", marks: [{ type: "bold" }] }] }] });

for (const unsafe of [
  { type: "doc", content: [{ type: "image", attrs: { src: imageSrc, width: 9 } }] },
  { type: "doc", content: [{ type: "image", attrs: { src: imageSrc, width: 101 } }] },
  { type: "doc", content: [{ type: "image", attrs: { src: imageSrc, width: "58%" } }] },
]) assert.throws(() => parseAndNormalizeContent(JSON.stringify(unsafe)));

assert.equal(resolveFeaturedImagePath(imageSrc, "keep"), imageSrc);
assert.equal(resolveFeaturedImagePath("/api/uploads/replacement.png", "replace"), "/api/uploads/replacement.png");
assert.equal(resolveFeaturedImagePath(imageSrc, "remove"), null);
assert.equal(clampImageWidth(0), 10);
assert.equal(clampImageWidth(500), 100);

console.log("PASS: colors, numeric widths, bounds, legacy sizing, and Featured Image keep/replace/remove behavior are structurally verified.");
