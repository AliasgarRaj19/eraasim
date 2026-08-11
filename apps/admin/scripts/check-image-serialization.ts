import assert from "node:assert/strict";
import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { ResizableImage } from "../components/resizable-image-extension";
import { parseAndNormalizeContent } from "../src/blog/content";
import { newImageAttributes } from "../src/blog/image-attributes";
import { parsePostFormData } from "../src/blog/post-input";

const imageSrc = "/api/uploads/123e4567-e89b-42d3-a456-426614174000.webp";
const extensions = [StarterKit, ResizableImage.configure({ allowBase64: false })];

function persistedJson(editor: Editor) {
  return JSON.parse(JSON.stringify(editor.getJSON())) as Record<string, unknown>;
}

function firstImageAttrs(document: Record<string, unknown>) {
  const image = (document.content as Record<string, unknown>[]).find((node) => node.type === "image");
  assert.ok(image, "editor document should contain an image");
  return image.attrs as Record<string, unknown>;
}

function passThroughNewPost(document: Record<string, unknown>) {
  const serialized = JSON.stringify(document);
  const formData = new FormData();
  formData.set("title", "Image regression");
  formData.set("slug", "image-regression");
  formData.set("shortDescription", "Image serialization regression");
  formData.set("content", serialized);
  formData.set("intent", "draft");
  const parsed = parsePostFormData(formData);
  assert.equal(parsed.success, true, "actual hidden content field must pass the New Post FormData parser");
  assert.ok(parsed.success);
  return parseAndNormalizeContent(parsed.data.content);
}

const editor = new Editor({ extensions, content: { type: "doc", content: [] } });
editor.commands.insertContent({ type: "image", attrs: newImageAttributes(imageSrc) });
const fresh = persistedJson(editor);
assert.deepEqual(firstImageAttrs(fresh), { src: imageSrc, alt: "", title: null, width: 100 });
assert.equal("displaySize" in firstImageAttrs(fresh), false, "fresh serialized images must omit displaySize");
const storedAt100 = passThroughNewPost(fresh);
assert.equal(firstImageAttrs(storedAt100).width, 100);

editor.chain().setNodeSelection(0).updateAttributes("image", { width: 55 }).run();
const resized = persistedJson(editor);
assert.equal(firstImageAttrs(resized).width, 55);
assert.equal("displaySize" in firstImageAttrs(resized), false, "resized serialized images must omit displaySize");
const storedAt55 = passThroughNewPost(resized);
assert.equal(firstImageAttrs(storedAt55).width, 55);

const reloaded = new Editor({ extensions, content: storedAt55 });
assert.equal(firstImageAttrs(persistedJson(reloaded)).width, 55, "saved width must survive editor reload");
reloaded.chain().setNodeSelection(0).updateAttributes("image", { width: 62 }).run();
const storedAt62 = passThroughNewPost(persistedJson(reloaded));
assert.equal(firstImageAttrs(storedAt62).width, 62, "reloaded images must remain resizable and saveable");

for (const [displaySize, expectedWidth] of Object.entries({ small: 25, medium: 50, large: 75, full: 100 })) {
  const legacyEditor = new Editor({ extensions, content: { type: "doc", content: [{ type: "image", attrs: { src: imageSrc, displaySize } }] } });
  const normalized = passThroughNewPost(persistedJson(legacyEditor));
  assert.equal(firstImageAttrs(normalized).width, expectedWidth, `legacy ${displaySize} must normalize`);
  assert.equal("displaySize" in firstImageAttrs(normalized), false, "normalized legacy output must be canonical");
  legacyEditor.destroy();
}

for (const displaySize of [undefined, null, ""]) {
  const attrs: Record<string, unknown> = { src: imageSrc };
  if (displaySize !== undefined) attrs.displaySize = displaySize;
  const normalized = parseAndNormalizeContent(JSON.stringify({ type: "doc", content: [{ type: "image", attrs }] }));
  assert.equal(firstImageAttrs(normalized).width, 100, "missing/null/empty legacy size must default to 100");
}

assert.equal(firstImageAttrs(parseAndNormalizeContent(JSON.stringify({ type: "doc", content: [{ type: "image", attrs: { src: imageSrc, width: 44, displaySize: "obsolete" } }] }))).width, 44, "canonical width must take precedence");
for (const attrs of [
  { src: imageSrc, displaySize: "obsolete" },
  { src: imageSrc, width: 9 },
  { src: imageSrc, width: 101 },
  { src: imageSrc, width: "50%" },
  { src: imageSrc, width: "500px" },
  { src: imageSrc, width: "calc(100% + 1px)" },
]) assert.throws(() => parseAndNormalizeContent(JSON.stringify({ type: "doc", content: [{ type: "image", attrs }] })));

editor.destroy();
reloaded.destroy();
console.log(`PASS: actual fresh editor JSON ${JSON.stringify(firstImageAttrs(fresh))}; fresh/resized/reloaded/legacy normalization and invalid width rejection verified.`);
