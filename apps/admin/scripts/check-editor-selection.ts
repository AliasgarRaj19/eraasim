import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { parseAndNormalizeContent } from "../src/blog/content";
import { captureEditorSelection, restoreEditorSelection } from "../src/blog/editor-selection";

const documentOf = (...texts: string[]) => ({ type: "doc", content: texts.map((text) => ({ type: "paragraph", content: [{ type: "text", text }] })) });
const editorOf = (...texts: string[]) => new Editor({ extensions: [StarterKit], content: documentOf(...texts) });
const textBlockRanges = (editor: Editor) => {
  const ranges: { from: number; to: number }[] = [];
  editor.state.doc.descendants((node, position) => {
    if (node.isTextblock) ranges.push({ from: position + 1, to: position + node.nodeSize - 1 });
  });
  return ranges;
};
const collapseThenRestore = (editor: Editor, from: number, to: number) => {
  editor.commands.setTextSelection({ from, to });
  const snapshot = captureEditorSelection(editor);
  assert.deepEqual({ from: editor.state.selection.from, to: editor.state.selection.to }, { from, to });
  editor.commands.setTextSelection(1); // Reproduce browser focus collapse before a toolbar click.
  assert.equal(restoreEditorSelection(editor, snapshot), true);
  assert.deepEqual({ from: editor.state.selection.from, to: editor.state.selection.to }, { from, to });
};

const reproduction = editorOf("Paragraph A", "Target Heading", "Paragraph B");
const intended = textBlockRanges(reproduction)[1];
reproduction.commands.setTextSelection(intended);
reproduction.commands.setTextSelection(1);
reproduction.chain().focus().toggleHeading({ level: 2 }).run();
assert.deepEqual(reproduction.getJSON().content?.map((node) => node.type), ["heading", "paragraph", "paragraph"], "a collapsed live selection reproduces formatting the wrong block");
reproduction.destroy();

for (const level of [2, 3] as const) {
  const editor = editorOf("Paragraph A", "Target Heading", "Paragraph B", "Paragraph C");
  const target = textBlockRanges(editor)[1];
  collapseThenRestore(editor, target.from, target.to);
  editor.chain().focus().toggleHeading({ level }).run();
  assert.deepEqual(editor.getJSON().content?.map((node) => [node.type, node.attrs?.level]), [["paragraph", undefined], ["heading", level], ["paragraph", undefined], ["paragraph", undefined]]);
  editor.destroy();
}

for (const kind of ["bullet", "ordered"] as const) {
  const editor = editorOf("Paragraph A", "Item 1", "Item 2", "Item 3", "Paragraph B");
  const ranges = textBlockRanges(editor);
  collapseThenRestore(editor, ranges[1].from, ranges[3].to);
  if (kind === "bullet") editor.chain().focus().toggleBulletList().run(); else editor.chain().focus().toggleOrderedList().run();
  assert.deepEqual(editor.getJSON().content?.map((node) => node.type), ["paragraph", kind === "bullet" ? "bulletList" : "orderedList", "paragraph"]);
  assert.equal(editor.getJSON().content?.[1].content?.length, 3);
  editor.destroy();
}

for (const selection of [{ endBlock: 1, count: 1 }, { endBlock: 2, count: 2 }]) {
  const editor = editorOf("Paragraph A", "Quote One", "Quote Two", "Paragraph B");
  const ranges = textBlockRanges(editor);
  collapseThenRestore(editor, ranges[1].from, ranges[selection.endBlock].to);
  editor.chain().focus().toggleBlockquote().run();
  assert.deepEqual(editor.getJSON().content?.map((node) => node.type), selection.count === 1 ? ["paragraph", "blockquote", "paragraph", "paragraph"] : ["paragraph", "blockquote", "paragraph"]);
  assert.equal(editor.getJSON().content?.[1].content?.length, selection.count);
  editor.destroy();
}

const linkEditor = editorOf("Before Target After");
const linkBlock = textBlockRanges(linkEditor)[0];
collapseThenRestore(linkEditor, linkBlock.from + "Before ".length, linkBlock.from + "Before Target".length);
linkEditor.chain().focus().setLink({ href: "https://example.com" }).run();
const linkedJson = linkEditor.getJSON();
const linkedNodes = linkedJson.content?.[0].content ?? [];
const linkedTarget = linkedNodes[1] as { text?: string; marks?: { type?: string }[] } | undefined;
assert.equal(linkedTarget?.text, "Target");
assert.equal(linkedTarget?.marks?.[0]?.type, "link");
assert.equal(linkedNodes[0]?.marks, undefined);
assert.equal(linkedNodes[2]?.marks, undefined);
const normalizedLinkJson = parseAndNormalizeContent(JSON.stringify(linkedJson));
assert.deepEqual(parseAndNormalizeContent(JSON.stringify(normalizedLinkJson)), normalizedLinkJson);
assert.throws(() => parseAndNormalizeContent(JSON.stringify({ type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Unsafe", marks: [{ type: "link", attrs: { href: "javascript:alert(1)" } }] }] }] })));
linkEditor.destroy();

const toolbar = readFileSync(new URL("../components/rich-text-editor.tsx", import.meta.url), "utf8");
for (const match of toolbar.matchAll(/<button\b([^>]*)>/g)) assert.match(match[1], /\btype="button"/, `Toolbar button lacks type=button: ${match[0]}`);

console.log("PASS: exact selections survive simulated collapse; H2/H3/lists/quotes/links stay scoped; links round-trip; unsafe links and submit-capable toolbar buttons are rejected.");
