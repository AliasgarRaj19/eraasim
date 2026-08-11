"use client";

import Image from "@tiptap/extension-image";
import Youtube from "@tiptap/extension-youtube";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useRef, useState } from "react";
import { uploadImage } from "@/components/image-upload";
import { canonicalYouTubeUrl } from "@/src/blog/youtube";

const initialContent = { type: "doc", content: [{ type: "paragraph" }] };

export function RichTextEditor({ name, error }: { name: string; error?: string }) {
  const [value, setValue] = useState(JSON.stringify(initialContent));
  const [message, setMessage] = useState<string>();
  const [uploading, setUploading] = useState(false);
  const imageInput = useRef<HTMLInputElement>(null);
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
        link: { openOnClick: false, autolink: true, protocols: ["http", "https", "mailto"] },
      }),
      Image.configure({ allowBase64: false }),
      Youtube.configure({ controls: true, nocookie: true, modestBranding: true }),
    ],
    content: initialContent,
    onUpdate: ({ editor: currentEditor }) => setValue(JSON.stringify(currentEditor.getJSON())),
    editorProps: { attributes: { class: "editor-surface", "aria-label": "Long Description / Content" } },
  });

  if (!editor) return <div className="editor-loading">Loading editor…</div>;

  const addLink = () => {
    const previous = editor.getAttributes("link").href as string | undefined;
    const href = window.prompt("Enter an http(s) or mailto link", previous ?? "https://");
    if (href === null) return;
    if (!href) editor.chain().focus().unsetLink().run();
    else editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
  };

  const addYouTube = () => {
    const value = window.prompt("Enter a YouTube video URL");
    if (!value) return;
    const canonical = canonicalYouTubeUrl(value);
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
      editor.chain().focus().setImage({ src, alt: "" }).run();
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
      <div className="editor-toolbar" role="toolbar" aria-label="Content formatting">
        <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} aria-pressed={editor.isActive("bold")}>Bold</button>
        <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} aria-pressed={editor.isActive("italic")}>Italic</button>
        <button type="button" onClick={() => editor.chain().focus().toggleUnderline().run()} aria-pressed={editor.isActive("underline")}>Underline</button>
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} aria-pressed={editor.isActive("heading", { level: 2 })}>H2</button>
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} aria-pressed={editor.isActive("heading", { level: 3 })}>H3</button>
        <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} aria-pressed={editor.isActive("bulletList")}>Bullets</button>
        <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} aria-pressed={editor.isActive("orderedList")}>Numbers</button>
        <button type="button" onClick={() => editor.chain().focus().toggleBlockquote().run()} aria-pressed={editor.isActive("blockquote")}>Quote</button>
        <button type="button" onClick={addLink} aria-pressed={editor.isActive("link")}>Link</button>
        <button type="button" onClick={() => imageInput.current?.click()} disabled={uploading}>{uploading ? "Uploading…" : "Add Image"}</button>
        <button type="button" onClick={addYouTube}>Embed YouTube Video</button>
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
