"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { CreatePostState } from "@/app/(admin)/blog/new/actions";
import { requirePermission } from "@/src/auth/authorization";
import { contentHasBody, parseAndNormalizeContent } from "@/src/blog/content";
import { resolveFeaturedImagePath } from "@/src/blog/featured-image";
import { validatedCategoryAssignment } from "@/src/blog/category-assignment";
import { parsePostFormData } from "@/src/blog/post-input";
import { competingSlugPredicate, editablePostPredicate } from "@/src/blog/post-edit";
import { resolvePublishingState } from "@/src/blog/publishing";
import { isValidSlug, slugify } from "@/src/blog/slug";
import { db } from "@/src/db";
import { activityLogs, categories, posts } from "@/src/db/schema";

const editIdentitySchema = z.object({ postId: z.uuid(), expectedUpdatedAt: z.iso.datetime() });

function optionalText(value: string | undefined) {
  return value ? value : null;
}

export async function updatePost(_state: CreatePostState, formData: FormData): Promise<CreatePostState> {
  const identity = editIdentitySchema.safeParse(Object.fromEntries(formData));
  if (!identity.success) return { error: "This edit request is invalid. Reload the post and try again." };

  const parsed = parsePostFormData(formData);
  if (!parsed.success) return { error: "Review the highlighted fields and try again.", fieldErrors: parsed.error.flatten().fieldErrors };

  const slug = slugify(parsed.data.slug);
  if (!isValidSlug(slug)) {
    return { fieldErrors: { slug: ["Use lowercase letters, numbers, and single hyphens only."] } };
  }

  let content: Record<string, unknown>;
  try {
    content = parseAndNormalizeContent(parsed.data.content);
  } catch (error) {
    return { fieldErrors: { content: [error instanceof Error ? error.message : "Content is invalid."] } };
  }
  if (!contentHasBody(content)) return { fieldErrors: { content: ["Add article content before saving."] } };

  const featuredImagePath = resolveFeaturedImagePath(parsed.data.featuredImagePath, parsed.data.featuredImageIntent);
  if (featuredImagePath && !/^\/api\/uploads\/[0-9a-f-]{36}\.(?:jpe?g|png|webp|gif)$/i.test(featuredImagePath)) {
    return { fieldErrors: { featuredImagePath: ["Upload the featured image through Eraasim."] } };
  }

  const { session } = await requirePermission("blog.posts.edit");
  const now = new Date();
  let updatedPostId: string | undefined;

  try {
    await db.transaction(async (tx) => {
      const [current] = await tx.select({
        id: posts.id,
        status: posts.status,
        scheduledFor: posts.scheduledFor,
        publishedAt: posts.publishedAt,
        unpublishedAt: posts.unpublishedAt,
        updatedAt: posts.updatedAt,
      }).from(posts).where(editablePostPredicate(identity.data.postId)).limit(1).for("update");

      if (!current) throw new Error("POST_NOT_EDITABLE");
      if (current.updatedAt.toISOString() !== identity.data.expectedUpdatedAt) throw new Error("POST_STALE");

      const [duplicate] = await tx.select({ id: posts.id }).from(posts).where(competingSlugPredicate(current.id, slug)).limit(1);
      if (duplicate) throw new Error("SLUG_DUPLICATE");

      let foundCategoryId: string | undefined;
      if (parsed.data.categoryId) {
        const [category] = await tx.select({ id: categories.id }).from(categories).where(eq(categories.id, parsed.data.categoryId)).limit(1);
        foundCategoryId = category?.id;
      }
      const categoryId = validatedCategoryAssignment(parsed.data.categoryId, foundCategoryId);

      const publishing = resolvePublishingState(current, parsed.data.intent, parsed.data.scheduledLocal, now);
      if (!publishing.ok) throw new Error("SCHEDULE_INVALID");

      await tx.update(posts).set({
        title: parsed.data.title,
        slug,
        shortDescription: parsed.data.shortDescription,
        content,
        featuredImagePath,
        categoryId,
        seoTitle: optionalText(parsed.data.seoTitle),
        seoDescription: optionalText(parsed.data.seoDescription),
        ...publishing.state,
        updatedById: session.user.id,
        updatedAt: now,
      }).where(eq(posts.id, current.id));

      const events = ["blog.post.updated"];
      if (parsed.data.intent === "published") events.push("blog.post.published");
      if (parsed.data.intent === "scheduled") events.push("blog.post.scheduled");
      if (parsed.data.intent === "unpublished") events.push("blog.post.unpublished");
      if (parsed.data.intent === "draft" && current.status !== "draft") events.push("blog.post.drafted");

      await tx.insert(activityLogs).values(events.map((action) => ({
        staffAccountId: session.user.id,
        action,
        entityType: "post",
        entityId: current.id,
        description: action === "blog.post.updated" ? "Blog post updated." : `Blog post status changed to ${publishing.state.status}.`,
        metadata: { slug, previousStatus: current.status, newStatus: publishing.state.status },
      })));
      updatedPostId = current.id;
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message === "SLUG_DUPLICATE") return { fieldErrors: { slug: ["This slug is already in use. Choose another."] } };
    if (message === "SCHEDULE_INVALID") return { fieldErrors: { scheduledLocal: ["Choose a future date and time in Asia/Kolkata."] } };
    if (message === "POST_STALE") return { error: "This post changed after you opened it. Reload the page before saving your changes." };
    if (message === "POST_NOT_EDITABLE") return { error: "This post no longer exists or is not available for editing." };
    if (message === "CATEGORY_UNAVAILABLE") return { fieldErrors: { categoryId: ["The selected category is no longer available."] } };
    const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";
    if (code === "23505") return { fieldErrors: { slug: ["This slug is already in use. Choose another."] } };
    console.error("Post update transaction failed.", { code: code || undefined, name: error instanceof Error ? error.name : "UnknownError" });
    return { error: "The post could not be updated. Try again or contact an administrator." };
  }

  redirect(`/blog/${updatedPostId}/edit?updated=1`);
}
