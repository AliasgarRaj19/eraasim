"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { requireRouteAccess } from "@/src/auth/authorization";
import { contentHasBody, parseAndNormalizeContent } from "@/src/blog/content";
import { resolveFeaturedImagePath } from "@/src/blog/featured-image";
import { validatedCategoryAssignment } from "@/src/blog/category-assignment";
import { parsePostFormData } from "@/src/blog/post-input";
import { resolvePublishingState } from "@/src/blog/publishing";
import { isValidSlug, slugify } from "@/src/blog/slug";
import { db } from "@/src/db";
import { activityLogs, categories, posts } from "@/src/db/schema";

export type CreatePostState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

function optionalText(value: string | undefined) {
  return value ? value : null;
}

export async function createPost(_state: CreatePostState, formData: FormData): Promise<CreatePostState> {
  const parsed = parsePostFormData(formData);
  if (!parsed.success) return { error: "Review the highlighted fields and try again.", fieldErrors: parsed.error.flatten().fieldErrors };
  if (parsed.data.intent === "preserve") return { error: "Choose a publishing action." };

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

  const { session } = await requireRouteAccess("/blog/new");
  const now = new Date();
  const publishing = resolvePublishingState(
    { status: "draft", scheduledFor: null, publishedAt: null, unpublishedAt: null },
    parsed.data.intent,
    parsed.data.scheduledLocal,
    now,
  );
  if (!publishing.ok) return { fieldErrors: { scheduledLocal: [publishing.error] } };

  try {
    await db.transaction(async (tx) => {
      let foundCategoryId: string | undefined;
      if (parsed.data.categoryId) {
        const [category] = await tx.select({ id: categories.id }).from(categories).where(eq(categories.id, parsed.data.categoryId)).limit(1);
        foundCategoryId = category?.id;
      }
      const categoryId = validatedCategoryAssignment(parsed.data.categoryId, foundCategoryId);

      const [post] = await tx.insert(posts).values({
        title: parsed.data.title,
        slug,
        shortDescription: parsed.data.shortDescription,
        content,
        featuredImagePath,
        categoryId,
        ...publishing.state,
        seoTitle: optionalText(parsed.data.seoTitle),
        seoDescription: optionalText(parsed.data.seoDescription),
        commentsEnabled: parsed.data.commentsEnabled,
        createdById: session.user.id,
        updatedById: session.user.id,
      }).returning({ id: posts.id });

      const events = ["blog.post.created"];
      if (parsed.data.intent === "published") events.push("blog.post.published");
      if (parsed.data.intent === "scheduled") events.push("blog.post.scheduled");
      await tx.insert(activityLogs).values(events.map((action) => ({
        staffAccountId: session.user.id,
        action,
        entityType: "post",
        entityId: post.id,
        description: action === "blog.post.created" ? "Blog post created." : `Blog post marked ${parsed.data.intent}.`,
        metadata: { status: parsed.data.intent, slug },
      })));
    });
  } catch (error) {
    if (error instanceof Error && error.message === "CATEGORY_UNAVAILABLE") return { fieldErrors: { categoryId: ["The selected category is no longer available."] } };
    const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";
    if (code === "23505") return { fieldErrors: { slug: ["This slug is already in use. Choose another."] } };
    console.error("Post creation transaction failed.", {
      code: code || undefined,
      name: error instanceof Error ? error.name : "UnknownError",
    });
    return { error: "The post could not be created. Try again or contact an administrator." };
  }

  redirect("/blog?created=1");
}
