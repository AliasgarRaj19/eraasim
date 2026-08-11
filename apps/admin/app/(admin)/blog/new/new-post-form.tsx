"use client";

import { useActionState, useState } from "react";
import Image from "next/image";
import { createPost, type CreatePostState } from "@/app/(admin)/blog/new/actions";
import { uploadImage } from "@/components/image-upload";
import { RichTextEditor } from "@/components/rich-text-editor";
import { slugify } from "@/src/blog/slug";

const initialState: CreatePostState = {};

function FieldError({ messages }: { messages?: string[] }) {
  return messages?.length ? <p className="field-error" role="alert">{messages[0]}</p> : null;
}

export function NewPostForm({ categories }: { categories: { id: string; name: string }[] }) {
  const [state, action, pending] = useActionState(createPost, initialState);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [summary, setSummary] = useState("");
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [featuredImage, setFeaturedImage] = useState("");
  const [imageStatus, setImageStatus] = useState<string>();
  const [imageUploading, setImageUploading] = useState(false);

  const updateTitle = (value: string) => {
    setTitle(value);
    if (!slugEdited) setSlug(slugify(value));
  };

  const uploadFeaturedImage = async (file: File | undefined) => {
    if (!file) return;
    setImageUploading(true);
    setImageStatus(undefined);
    try {
      const url = await uploadImage(file);
      setFeaturedImage(url);
      setImageStatus("Featured image uploaded.");
    } catch (error) {
      setImageStatus(error instanceof Error ? error.message : "Image upload failed.");
    } finally {
      setImageUploading(false);
    }
  };

  const fieldError = (name: string) => state.fieldErrors?.[name];

  return (
    <section className="new-post-page" aria-labelledby="new-post-title">
      <div className="page-heading">
        <p className="page-eyebrow">Blog</p>
        <h1 id="new-post-title">New Post</h1>
        <p>Create article content and choose how it enters the publishing workflow.</p>
      </div>

      <form className="post-form" action={action}>
        {state.error ? <p className="form-error" role="alert">{state.error}</p> : null}

        <div className="post-form-main">
          <section className="form-section" aria-labelledby="post-details-heading">
            <div className="section-heading"><h2 id="post-details-heading">Post details</h2><p>Core article information and future public link.</p></div>
            <label>Title
              <input name="title" value={title} onChange={(event) => updateTitle(event.target.value)} maxLength={200} required disabled={pending} />
              <FieldError messages={fieldError("title")} />
            </label>
            <label>Link / Slug
              <div className="slug-input"><span>/blog/</span><input name="slug" value={slug} onChange={(event) => { setSlugEdited(true); setSlug(slugify(event.target.value)); }} maxLength={180} required disabled={pending} /></div>
              <small>Generated from the title until you edit it manually.</small>
              <FieldError messages={fieldError("slug")} />
            </label>
            <label>Short Description / Summary
              <textarea name="shortDescription" value={summary} onChange={(event) => setSummary(event.target.value)} rows={4} maxLength={500} required disabled={pending} />
              <span className="character-count">{summary.length}/500</span>
              <FieldError messages={fieldError("shortDescription")} />
            </label>
          </section>

          <section className="form-section" aria-labelledby="featured-heading">
            <div className="section-heading"><h2 id="featured-heading">Featured Image</h2><p>JPEG, PNG, WebP, or GIF up to 5 MB.</p></div>
            <input type="hidden" name="featuredImagePath" value={featuredImage} />
            <label className="upload-control">Choose image
              <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(event) => void uploadFeaturedImage(event.target.files?.[0])} disabled={pending || imageUploading} />
            </label>
            {featuredImage ? <Image className="featured-preview" src={featuredImage} alt="Featured image preview" width={960} height={540} unoptimized /> : null}
            {imageStatus ? <p className="field-note" role="status">{imageStatus}</p> : null}
            <FieldError messages={fieldError("featuredImagePath")} />
          </section>

          <section className="form-section" aria-labelledby="content-heading">
            <div className="section-heading"><h2 id="content-heading">Long Description / Content</h2><p>Use structured formatting, Eraasim images, and controlled YouTube embeds.</p></div>
            <RichTextEditor name="content" error={fieldError("content")?.[0]} />
          </section>

          <section className="form-section" aria-labelledby="seo-heading">
            <div className="section-heading"><h2 id="seo-heading">SEO</h2><p>Optional guidance for future public metadata.</p></div>
            <label>SEO Title
              <input name="seoTitle" value={seoTitle} onChange={(event) => setSeoTitle(event.target.value)} disabled={pending} />
              <span className="character-count">{seoTitle.length} characters · approximately 50–60 recommended</span>
              <FieldError messages={fieldError("seoTitle")} />
            </label>
            <label>SEO Description
              <textarea name="seoDescription" value={seoDescription} onChange={(event) => setSeoDescription(event.target.value)} rows={4} disabled={pending} />
              <span className="character-count">{seoDescription.length} characters · approximately 150–160 recommended</span>
              <FieldError messages={fieldError("seoDescription")} />
            </label>
          </section>
        </div>

        <aside className="post-form-sidebar">
          <section className="form-section publishing-section" aria-labelledby="publishing-heading">
            <div className="section-heading"><h2 id="publishing-heading">Publishing</h2><p>Timestamps are entered in Asia/Kolkata and stored in UTC.</p></div>
            <label>Select Category
              {categories.length === 0 ? <input type="hidden" name="categoryId" value="" /> : null}
              <select name={categories.length ? "categoryId" : undefined} defaultValue="" disabled={pending || categories.length === 0}>
                <option value="">No category</option>
                {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
              </select>
              <FieldError messages={fieldError("categoryId")} />
            </label>
            {categories.length === 0 ? <p className="field-note">No categories available. Create a category first. Category is optional for now.</p> : null}
            <label>Schedule date and time
              <input name="scheduledLocal" type="datetime-local" disabled={pending} />
              <small>Required only when choosing Schedule Later.</small>
              <FieldError messages={fieldError("scheduledLocal")} />
            </label>
            <div className="publishing-actions">
              <button type="submit" name="intent" value="draft" disabled={pending}>{pending ? "Saving…" : "Save as Draft"}</button>
              <button className="primary-action" type="submit" name="intent" value="published" disabled={pending}>Publish Now</button>
              <button type="submit" name="intent" value="scheduled" disabled={pending}>Schedule Later</button>
              <button className="quiet-action" type="submit" name="intent" value="unpublished" disabled={pending}>Unpublished</button>
            </div>
          </section>
        </aside>
      </form>
    </section>
  );
}
