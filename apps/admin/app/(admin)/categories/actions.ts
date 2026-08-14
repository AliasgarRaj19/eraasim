"use server";

import { and, eq, isNull, ne } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requirePermission } from "@/src/auth/authorization";
import { canCreateChild, categoryDeleteBlocker, parseCategoryInput } from "@/src/categories/category";
import { db } from "@/src/db";
import { activityLogs, categories, posts } from "@/src/db/schema";

export type CategoryFormState = { error?: string; fieldErrors?: Record<string, string[]> };
const optionalIdentitySchema = z.uuid().optional();

async function saveCategoryWithIdentity(_state: CategoryFormState, formData: FormData, categoryId?: string, parentId?: string): Promise<CategoryFormState> {
  const parsed = parseCategoryInput(formData);
  if (!parsed.success) return { error: "Review the highlighted fields.", fieldErrors: parsed.error.flatten().fieldErrors };
  const editing = Boolean(categoryId);
  const { session } = await requirePermission(editing ? "categories.edit" : "categories.create");

  try {
    let savedId = "";
    await db.transaction(async (tx) => {
      if (editing) {
        const [current] = await tx.select({ id: categories.id, parentId: categories.parentId }).from(categories).where(eq(categories.id, categoryId!)).limit(1).for("update");
        if (!current) throw new Error("CATEGORY_NOT_FOUND");
        const [duplicate] = await tx.select({ id: categories.id }).from(categories).where(and(eq(categories.slug, parsed.data.slug), ne(categories.id, current.id))).limit(1);
        if (duplicate) throw new Error("SLUG_DUPLICATE");
        if(parsed.data.featuredPostId){const[featured]=await tx.select({id:posts.id}).from(posts).where(and(eq(posts.id,parsed.data.featuredPostId),eq(posts.categoryId,current.id),eq(posts.status,"published"),isNull(posts.deletedAt))).limit(1);if(!featured)throw new Error("INVALID_FEATURED_POST")}
        await tx.update(categories).set({ name: parsed.data.name, slug: parsed.data.slug, description: parsed.data.description, seoTitle:parsed.data.seoTitle,seoDescription:parsed.data.seoDescription,featuredPostId:parsed.data.featuredPostId, updatedAt: new Date() }).where(eq(categories.id, current.id));
        savedId = current.id;
        await tx.insert(activityLogs).values({ staffAccountId: session.user.id, action: "category.updated", entityType: "category", entityId: current.id, description: "Category updated.", metadata: { categoryId: current.id, parentCategoryId: current.parentId, slug: parsed.data.slug } });
      } else {
        if (parentId) {
          const [parent] = await tx.select({ id: categories.id, parentId: categories.parentId }).from(categories).where(eq(categories.id, parentId)).limit(1).for("update");
          if (!canCreateChild(parent, parentId)) throw new Error("INVALID_PARENT");
        }
        const [duplicate] = await tx.select({ id: categories.id }).from(categories).where(eq(categories.slug, parsed.data.slug)).limit(1);
        if (duplicate) throw new Error("SLUG_DUPLICATE");
        if(parsed.data.featuredPostId)throw new Error("INVALID_FEATURED_POST");
        const [created] = await tx.insert(categories).values({ name: parsed.data.name, slug: parsed.data.slug, description: parsed.data.description,seoTitle:parsed.data.seoTitle,seoDescription:parsed.data.seoDescription,featuredPostId:null, parentId: parentId ?? null }).returning({ id: categories.id });
        savedId = created.id;
        await tx.insert(activityLogs).values({ staffAccountId: session.user.id, action: "category.created", entityType: "category", entityId: created.id, description: parentId ? "Child category created." : "Parent category created.", metadata: { categoryId: created.id, parentCategoryId: parentId ?? null, slug: parsed.data.slug } });
      }
    });
    redirect(`/categories?result=${editing ? "updated" : "created"}&category=${savedId}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";
    const constraint = typeof error === "object" && error && "constraint" in error ? String(error.constraint) : "";
    if (constraint === "categories_name_normalized_uidx") return { fieldErrors: { name: ["This category name is already in use."] } };
    if (message === "SLUG_DUPLICATE" || code === "23505") return { fieldErrors: { slug: ["This category slug is already in use."] } };
    if (message === "INVALID_PARENT") return { error: "Child categories can only be created under a Parent Category." };
    if (message === "CATEGORY_NOT_FOUND") return { error: "This category no longer exists." };
    if (message === "INVALID_FEATURED_POST") return { error: "Featured Post must be a currently published post assigned directly to this category." };
    throw error;
  }
}

export async function createParentCategory(state: CategoryFormState, formData: FormData) {
  return saveCategoryWithIdentity(state, formData);
}

export async function createChildCategory(parentId: string, state: CategoryFormState, formData: FormData) {
  const parsedParentId = optionalIdentitySchema.safeParse(parentId);
  if (!parsedParentId.success || !parsedParentId.data) return { error: "This Parent Category request is invalid." };
  return saveCategoryWithIdentity(state, formData, undefined, parsedParentId.data);
}

export async function updateCategory(categoryId: string, state: CategoryFormState, formData: FormData) {
  const parsedCategoryId = optionalIdentitySchema.safeParse(categoryId);
  if (!parsedCategoryId.success || !parsedCategoryId.data) return { error: "This category request is invalid." };
  return saveCategoryWithIdentity(state, formData, parsedCategoryId.data);
}

export async function deleteCategory(formData: FormData) {
  const parsed = z.object({ categoryId: z.uuid().optional(), postId: z.uuid().optional() }).refine((value) => value.categoryId || value.postId).safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect("/categories?result=invalid");
  const categoryId = parsed.data.categoryId ?? parsed.data.postId!;
  const { session } = await requirePermission("categories.delete");
  const result = await db.transaction(async (tx) => {
    const [category] = await tx.select({ id: categories.id, slug: categories.slug, parentId: categories.parentId }).from(categories).where(eq(categories.id, categoryId)).limit(1).for("update");
    if (!category) return "not-found";
    const [child] = await tx.select({ id: categories.id }).from(categories).where(eq(categories.parentId, category.id)).limit(1).for("update");
    const [post] = await tx.select({ id: posts.id }).from(posts).where(eq(posts.categoryId, category.id)).limit(1).for("update");
    const blocker = categoryDeleteBlocker(Boolean(child), Boolean(post));
    if (blocker) return child ? "has-children" : "has-posts";
    await tx.delete(categories).where(eq(categories.id, category.id));
    await tx.insert(activityLogs).values({ staffAccountId: session.user.id, action: "category.deleted", entityType: "category", entityId: category.id, description: "Unused category deleted.", metadata: { categoryId: category.id, parentCategoryId: category.parentId, slug: category.slug } });
    return "deleted";
  });
  redirect(`/categories?result=${result}`);
}
