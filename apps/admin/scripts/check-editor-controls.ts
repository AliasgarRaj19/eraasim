import assert from "node:assert/strict";
import { parseAndNormalizeContent } from "../src/blog/content";

const imageSrc = "/api/uploads/123e4567-e89b-42d3-a456-426614174000.png";
const controlled = {
  type: "doc",
  content: [
    { type: "paragraph", content: [{ type: "text", text: "Colored", marks: [{ type: "textStyle", attrs: { color: "#285f9e" } }] }] },
    { type: "image", attrs: { src: imageSrc, alt: "Example", title: null, displaySize: "medium" } },
  ],
};
const normalized = parseAndNormalizeContent(JSON.stringify(controlled));
assert.deepEqual(normalized, controlled);

const withoutSize = parseAndNormalizeContent(JSON.stringify({ type: "doc", content: [{ type: "image", attrs: { src: imageSrc } }] }));
assert.equal(((withoutSize.content as Record<string, unknown>[])[0].attrs as Record<string, unknown>).displaySize, "full");

for (const unsafe of [
  { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Unsafe", marks: [{ type: "textStyle", attrs: { color: "expression(alert(1))" } }] }] }] },
  { type: "doc", content: [{ type: "image", attrs: { src: imageSrc, displaySize: "5000px" } }] },
]) assert.throws(() => parseAndNormalizeContent(JSON.stringify(unsafe)));

console.log("PASS: controlled text colors and image sizes round-trip; unsafe values are rejected; existing images default to full width.");
