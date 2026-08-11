"use client";

import { Color } from "@tiptap/extension-color";
import Image from "@tiptap/extension-image";
import { TextStyle } from "@tiptap/extension-text-style";
import Youtube from "@tiptap/extension-youtube";
import { EditorContent, ReactNodeViewRenderer, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useRef, useState } from "react";
import { uploadImage } from "@/components/image-upload";
import { ResizableImageNode } from "@/components/resizable-image-node";
import { isValidImageWidth, TEXT_COLORS } from "@/src/blog/editor-controls";
import { captureEditorSelection, restoreEditorSelection, type EditorSelectionSnapshot } from "@/src/blog/editor-selection";
import { canonicalYouTubeUrl } from "@/src/blog/youtube";

const emptyContent = { type: "doc", content: [{ type: "paragraph" }] };
const ResizableImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: (element) => {
          const width = Number(element.getAttribute("data-image-width"));
          return isValidImageWidth(width) ? width : null;
        },
        renderHTML: (attributes) => isValidImageWidth(attributes.width) ? { "data-image-width": attributes.width } : {},
      },
      displaySize: { default: null },
    };
  },
  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageNode);
  },
});

export function RichTextEditor({ name, error, initialContent = emptyContent }: { name: string; error?: string; initialContent?: Record<string, unknown> }) {
  const [value, setValue] = useState(JSON.stringify(initialContent));
  const [message, setMessage] = useState<string>();
  const [uploading, setUploading] = useState(false);
  const imageInput = useRef<HTMLInputElement>(null);
  const selectionSnapshot = useRef<EditorSelectionSnapshot | null>(null);
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
        link: { openOnClick: false, autolink: true, protocols: ["http", "https", "mailto"] },
      }),
      TextStyle,
      Color.configure({ types: ["textStyle"] }),
      ResizableImage.configure({ allowBase64: false }),
      Youtube.configure({ controls: true, nocookie: true, modestBranding: true }),
    ],
    content: initialContent,
    onCreate: ({ editor: currentEditor }) => { selectionSnapshot.current = captureEditorSelection(currentEditor); },
    onSelectionUpdate: ({ editor: currentEditor }) => { selectionSnapshot.current = captureEditorSelection(currentEditor); },
    onUpdate: ({ editor: currentEditor }) => setValue(JSON.stringify(currentEditor.getJSON())),
    editorProps: { attributes: { class: "editor-surface", "aria-label": "Long Description / Content" } },
  });

  if (!editor) return <div className="editor-loading">Loading editor…</div>;

  const captureSelection = () => {
    selectionSnapshot.current = captureEditorSelection(editor);
  };

  const restoreSelection = () => {
    if (!selectionSnapshot.current) return false;
    if (restoreEditorSelection(editor, selectionSnapshot.current)) return true;
    setMessage("The previous selection is no longer available. Select the text again.");
    return false;
  };

  const runWithSelection = (command: () => void) => {
    if (restoreSelection()) command();
  };

  const addLink = () => {
    if (!restoreSelection() || editor.state.selection.empty) return setMessage("Select text before adding a link.");
    const savedSelection = captureEditorSelection(editor);
    const previous = editor.getAttributes("link").href as string | undefined;
    const href = window.prompt("Enter an http(s) or mailto link", previous ?? "https://");
    if (href === null) return;
    selectionSnapshot.current = savedSelection;
    if (!restoreSelection()) return;
    if (!href) {
      setMessage(undefined);
      editor.chain().focus().unsetLink().run();
      return;
    }
    try {
      const url = new URL(href);
      if (!["http:", "https:", "mailto:"].includes(url.protocol)) throw new Error();
    } catch {
      return setMessage("Enter a valid http(s) or mailto URL.");
    }
    setMessage(undefined);
    editor.chain().focus().setLink({ href }).run();
  };

  const addYouTube = () => {
    const input = window.prompt("Enter a YouTube video URL");
    if (!input) return;
    const canonical = canonicalYouTubeUrl(input);
    if (!canonical) return setMessage("Enter a valid YouTube watch, short, live, embed, or youtu.be URL.");
    setMessage(undefined);
    editor.commands.setYoutubeVideo({ src: canonical, width: 640, height: 360 });
  };

  const addImage = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    setMessage(undefined);
    try {
      const src = await uploadImage(file);
      editor.chain().focus().setImage({ src, alt: "" }).updateAttributes("image", { width: 100, displaySize: null }).run();
    } catch (uploadError) {
      setMessage(uploadError instanceof Error ? uploadError.message : "Image upload failed.");
    } finally {
      setUploading(false);
      if (imageInput.current) imageInput.current.value = "";
    }
  };

  return (
    <div className="editor-field">
      <input type="hidden" name={name} value={value} />
      <div className="editor-toolbar" role="toolbar" aria-label="Content formatting" onPointerDown={(event) => { if ((event.target as HTMLElement).closest("button")) { captureSelection(); event.preventDefault(); } }}>
        <button type="button" onClick={() => runWithSelection(() => editor.chain().focus().toggleBold().run())} aria-pressed={editor.isActive("bold")}>Bold</button>
        <button type="button" onClick={() => runWithSelection(() => editor.chain().focus().toggleItalic().run())} aria-pressed={editor.isActive("italic")}>Italic</button>
        <button type="button" onClick={() => runWithSelection(() => editor.chain().focus().toggleUnderline().run())} aria-pressed={editor.isActive("underline")}>Underline</button>
        <button type="button" onClick={() => runWithSelection(() => editor.chain().focus().toggleHeading({ level: 2 }).run())} aria-pressed={editor.isActive("heading", { level: 2 })}>H2</button>
        <button type="button" onClick={() => runWithSelection(() => editor.chain().focus().toggleHeading({ level: 3 }).run())} aria-pressed={editor.isActive("heading", { level: 3 })}>H3</button>
        <button type="button" onClick={() => runWithSelection(() => editor.chain().focus().toggleBulletList().run())} aria-pressed={editor.isActive("bulletList")}>Bullets</button>
        <button type="button" onClick={() => runWithSelection(() => editor.chain().focus().toggleOrderedList().run())} aria-pressed={editor.isActive("orderedList")}>Numbers</button>
        <button type="button" onClick={() => runWithSelection(() => editor.chain().focus().toggleBlockquote().run())} aria-pressed={editor.isActive("blockquote")}>Quote</button>
        <button type="button" onClick={addLink} aria-pressed={editor.isActive("link")}>Link</button>
        <button type="button" onClick={() => imageInput.current?.click()} disabled={uploading}>{uploading ? "Uploading…" : "Add Image"}</button>
        <button type="button" onClick={addYouTube}>Embed YouTube Video</button>
        <button type="button" onClick={() => runWithSelection(() => editor.chain().focus().unsetColor().run())} aria-label="Reset text color">Color default</button>
        {Object.entries(TEXT_COLORS).map(([label, color]) => (
          <button className="color-button" key={label} type="button" onClick={() => runWithSelection(() => editor.chain().focus().setColor(color).run())} aria-label={`Text color ${label}`} aria-pressed={editor.isActive("textStyle", { color })}>
            <span className="color-swatch" style={{ backgroundColor: color }} aria-hidden="true" />{label}
          </button>
        ))}
        <button type="button" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}>Undo</button>
        <button type="button" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}>Redo</button>
      </div>
      <input ref={imageInput} className="visually-hidden" type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(event) => void addImage(event.target.files?.[0])} />
      <EditorContent editor={editor} />
      {message ? <p className="field-error" role="alert">{message}</p> : null}
      {error ? <p className="field-error" role="alert">{error}</p> : null}
    </div>
  );
}
