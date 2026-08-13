import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parseAndNormalizeContent } from "../src/blog/content";

const mark = (color: string, extra: Record<string, unknown>[] = []) => [{ type: "textStyle", attrs: { color } }, ...extra];
const nodes = [
  { type: "paragraph", content: [{ type: "text", text: "hex", marks: mark("#123456", [{ type: "bold" }]) }] },
  { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "rgb", marks: mark("rgb(1, 2, 3)", [{ type: "italic" }]) }] },
  { type: "bulletList", content: [{ type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "named", marks: mark("black") }] }] }] },
  { type: "blockquote", content: [{ type: "paragraph", content: [{ type: "text", text: "variable", marks: mark("var(--external)") }] }] },
  { type: "paragraph", content: [{ type: "text", text: "approved", marks: mark("#365B43") }] },
  { type: "paragraph", content: [{ type: "text", text: "link", marks: [{ type: "link", attrs: { href: "https://example.com/safe" } }] }] },
];
const normalized = parseAndNormalizeContent(JSON.stringify({ type: "doc", content: nodes }));
const serialized = JSON.stringify(normalized);
assert(!serialized.includes("#123456") && !serialized.includes("rgb(") && !serialized.includes("black") && !serialized.includes("var(--external)"));
assert(serialized.includes("#365b43") && serialized.includes('"type":"bold"') && serialized.includes('"type":"italic"'));
for (const text of ["hex", "rgb", "named", "variable", "approved", "link"]) assert(serialized.includes(`\"text\":\"${text}\"`));
assert(serialized.includes("https://example.com/safe") && serialized.includes("noopener noreferrer nofollow"));
assert.throws(() => parseAndNormalizeContent(JSON.stringify({ type: "doc", content: [{ type: "script", attrs: { onload: "alert(1)" } }] })));
assert.throws(() => parseAndNormalizeContent(JSON.stringify({ type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "x", marks: [{ type: "eventHandler", attrs: { onclick: "alert(1)" } }] }] }] })));
assert.throws(() => parseAndNormalizeContent("{malformed"));
const editor = readFileSync(new URL("../components/rich-text-editor.tsx", import.meta.url), "utf8");
assert(editor.includes("transformPastedHTML: normalizePastedHtml"));
for (const action of ["blog/new/actions.ts", "blog/[id]/edit/actions.ts"]) {
  const source = readFileSync(new URL(`../app/(admin)/${action}`, import.meta.url), "utf8");
  assert(source.includes("parseAndNormalizeContent"));
}
console.log("PASS: unsupported pasted/legacy colors strip safely; approved colors, semantics, text, and safe links survive; forged structures remain rejected across create/edit lifecycle paths.");
