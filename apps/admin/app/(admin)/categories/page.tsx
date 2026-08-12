import { asc, sql } from "drizzle-orm";
import Link from "next/link";
import { deleteCategory } from "@/app/(admin)/categories/actions";
import { ConfirmPostAction } from "@/components/confirm-post-action";
import { canUsePermission, requireRouteAccess } from "@/src/auth/authorization";
import { db } from "@/src/db";
import { categories } from "@/src/db/schema";

const messages: Record<string, string> = {
  created: "Category created successfully.", updated: "Category updated successfully.", deleted: "Category deleted successfully.",
  "has-children": "This category contains child categories. Delete or resolve them first.",
  "has-posts": "This category is referenced by posts. Reassign or remove those references first.",
  "not-found": "That category no longer exists.", invalid: "The category action was invalid.",
};

export default async function CategoriesPage({ searchParams }: { searchParams: Promise<{ result?: string }> }) {
  const { authorization } = await requireRouteAccess("/categories");
  const { result } = await searchParams;
  const rows = await db.select({
    id: categories.id, name: categories.name, slug: categories.slug, description: categories.description, parentId: categories.parentId,
    postCount: sql<number>`(select count(*)::int from posts where posts.category_id = ${categories.id} and posts.deleted_at is null)`,
    childCount: sql<number>`(select count(*)::int from categories children where children.parent_id = ${categories.id})`,
  }).from(categories).orderBy(asc(categories.name));
  const parents = rows.filter((category) => category.parentId === null);
  const children = rows.filter((category) => category.parentId !== null);
  const canCreate = canUsePermission(authorization, "categories.create");
  const canEdit = canUsePermission(authorization, "categories.edit");
  const canDelete = canUsePermission(authorization, "categories.delete");

  return <section className="category-list-page"><div className="list-page-header"><div><p className="page-eyebrow">Category</p><h1>Categories</h1><p>Manage the fixed two-level hierarchy used by Blog posts.</p></div>{canCreate ? <Link className="new-post-link" href="/categories/new">New Parent Category</Link> : null}</div>
    {result && messages[result] ? <p className={["created", "updated", "deleted"].includes(result) ? "success-message" : "form-error"}>{messages[result]}</p> : null}
    {parents.length === 0 ? <div className="post-list-empty"><h2>No categories found</h2><p>Create a Parent Category to begin.</p></div> : <div className="category-groups">{parents.map((parent) => <section className="category-group" key={parent.id}><header><div><h2>{parent.name}</h2><code>{parent.slug}</code>{parent.description ? <p>{parent.description}</p> : null}<small>{parent.postCount} directly assigned post{parent.postCount === 1 ? "" : "s"} Â· {parent.childCount} child categor{parent.childCount === 1 ? "y" : "ies"}</small></div><div className="category-actions">{canEdit ? <Link href={`/categories/${parent.id}/edit`}>Edit</Link> : null}{canCreate ? <Link href={`/categories/${parent.id}/children/new`}>Add Child Category</Link> : null}{canDelete ? <ConfirmPostAction action={deleteCategory} postId={parent.id} label="Delete" destructive confirmation="Delete this unused category? Categories with children or any post references cannot be deleted." /> : null}</div></header><div className="category-children">{children.filter((child) => child.parentId === parent.id).map((child) => <article key={child.id}><div><h3>{child.name}</h3><code>{child.slug}</code>{child.description ? <p>{child.description}</p> : null}<small>{child.postCount} directly assigned post{child.postCount === 1 ? "" : "s"}</small></div><div className="category-actions">{canEdit ? <Link href={`/categories/${child.id}/edit`}>Edit</Link> : null}{canDelete ? <ConfirmPostAction action={deleteCategory} postId={child.id} label="Delete" destructive confirmation="Delete this unused Child Category? It cannot be deleted while any post references it." /> : null}</div></article>)}</div></section>)}</div>}
  </section>;
}
