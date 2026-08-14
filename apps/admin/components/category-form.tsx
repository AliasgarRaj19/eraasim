"use client";

import { useActionState, useState } from "react";
import type { CategoryFormState } from "@/app/(admin)/categories/actions";
import { slugify } from "@/src/blog/slug";

type FeaturedOption={id:string;title:string};
export function CategoryForm({ category, parent, featuredOptions=[], action: submitAction }: { category?: { id: string; name: string; slug: string; description: string; parentId: string | null;seoTitle:string;seoDescription:string;featuredPostId:string|null }; parent?: { id: string; name: string };featuredOptions?:FeaturedOption[]; action: (state: CategoryFormState, formData: FormData) => Promise<CategoryFormState> }) {
  const [state, action, pending] = useActionState(submitAction, {} as CategoryFormState);
  const [name, setName] = useState(category?.name ?? "");
  const [slug, setSlug] = useState(category?.slug ?? "");
  const [slugEdited, setSlugEdited] = useState(Boolean(category));
  const child = Boolean(parent || category?.parentId);
  return <section className="category-form-page"><div className="page-heading"><p className="page-eyebrow">Category</p><h1>{category ? "Edit Category" : child ? "New Child Category" : "New Parent Category"}</h1><p>Categories support one Parent level and one Child level.</p></div>
    <form className="category-form form-section" action={action}>
      {parent ? <p className="category-parent-context"><strong>Parent Category:</strong> {parent.name}</p> : null}
      {category?.parentId ? <p className="field-note">This category remains a Child Category. Its parent cannot be changed in this milestone.</p> : null}
      {category && !category.parentId ? <p className="field-note">This category remains a Parent Category.</p> : null}
      {state.error ? <p className="form-error" role="alert">{state.error}</p> : null}
      <label>{child ? "Child Category Name" : "Category Name"}<input name="name" value={name} onChange={(event) => { const value = event.target.value; setName(value); if (!slugEdited) setSlug(slugify(value)); }} required maxLength={200} disabled={pending} />{state.fieldErrors?.name ? <span className="field-error">{state.fieldErrors.name[0]}</span> : null}</label>
      <label>Slug<div className="slug-input"><span>/category/</span><input name="slug" value={slug} onChange={(event) => { setSlugEdited(true); setSlug(event.target.value.toLowerCase()); }} onBlur={() => setSlug(slugify(slug))} required maxLength={180} disabled={pending} /></div>{state.fieldErrors?.slug ? <span className="field-error">{state.fieldErrors.slug[0]}</span> : null}</label>
      <label>Description<textarea name="description" defaultValue={category?.description ?? ""} rows={5} maxLength={2000} disabled={pending} /></label>
      <label>SEO Title<input name="seoTitle" defaultValue={category?.seoTitle??""} maxLength={200} disabled={pending}/><small>Falls back to the Category name.</small></label>
      <label>SEO Description<textarea name="seoDescription" defaultValue={category?.seoDescription??""} rows={3} maxLength={500} disabled={pending}/><small>Falls back to the Category description.</small></label>
      <label>Featured Post{featuredOptions.length?<select name="featuredPostId" defaultValue={category?.featuredPostId??""} disabled={pending}><option value="">No featured post</option>{featuredOptions.map(post=><option key={post.id} value={post.id}>{post.title}</option>)}</select>:<><input type="hidden" name="featuredPostId" value=""/><p className="field-note">No published posts are assigned directly to this Category. Save the Category and assign a post before selecting a featured story.</p></>}</label>
      <button type="submit" disabled={pending}>{pending ? "Savingâ€¦" : category ? "Save Category" : "Create Category"}</button>
    </form>
  </section>;
}
