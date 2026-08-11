"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireRouteAccess } from "@/src/auth/authorization";
import { parseAndNormalizeContent } from "@/src/blog/content";
import { isValidSlug, slugify } from "@/src/blog/slug";
import { db } from "@/src/db";
import { activityLogs, categories, posts } from "@/src/db/schema";

export type CreatePostState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

const postInputSchema = z.object({
  title: z.string().trim().min(1, "Title is required.").max(200, "Title must be 200 characters or fewer."),
  slug: z.string().trim().min(1, "Link / Slug is required.").max(180),
  shortDescription: z.string().trim().min(1, "Short Description / Summary is required.").max(500, "Summary must be 500 characters or fewer."),
  featuredImagePath: z.string().trim().max(500).optional(),
  categoryId: z.union([z.literal(""), z.uuid("Select a valid category.")]),
  content: z.string().min(1, "Long Description / Content is required."),
  seoTitle: z.string().trim().max(2_000, "SEO Title is too long.").optional(),
  seoDescription: z.string().trim().max(4_000, "SEO Description is too long.").optional(),
  intent: z.enum(["draft", "published", "scheduled", "unpublished"]),
  scheduledLocal: z.string().optional(),
});

function optionalText(value: string | undefined) {
  return value ? value : null;
}

function parseKolkataDateTime(value: string | undefined) {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value ?? "");
  if (!match) return null;
  const [, year, month, day, hour, minute] = match.map(Number);
  const kolkataOffset = (5 * 60 + 30) * 60_000;
  const timestamp = Date.UTC(year, month - 1, day, hour, minute) - kolkataOffset;
  const date = new Date(timestamp);
  const localCheck = new Date(timestamp + kolkataOffset);
  if (
    Number.isNaN(date.getTime()) ||
    localCheck.getUTCFullYear() !== year ||
    localCheck.getUTCMonth() !== month - 1 ||
    localCheck.getUTCDate() !== day ||
    localCheck.getUTCHours() !== hour ||
    localCheck.getUTCMinutes() !== minute
  ) return null;
  return date;
}

function contentHasBody(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const node = value as Record<string, unknown>;
  if (node.type === "image" || node.type === "youtube") return true;
  if (typeof node.text === "string" && node.text.trim()) return true;
  return Array.isArray(node.content) && node.content.some(contentHasBody);
}

export async function createPost(_state: CreatePostState, formData: FormData): Promise<CreatePostState> {
  const parsed = postInputSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  const slug = slugify(parsed.data.slug);
  if (!isValidSlug(slug) || slug !== parsed.data.slug.toLowerCase()) {
    return { fieldErrors: { slug: ["Use lowercase letters, numbers, and single hyphens only."] } };
  }

  let content: Record<string, unknown>;
  try {
    content = parseAndNormalizeContent(parsed.data.content);
  } catch (error) {
    return { fieldErrors: { content: [error instanceof Error ? error.message : "Content is invalid."] } };
  }
  if (!contentHasBody(content)) return { fieldErrors: { content: ["Add article content before saving."] } };

  const featuredImagePath = optionalText(parsed.data.featuredImagePath);
  if (featuredImagePath && !/^\/api\/uploads\/[0-9a-f-]{36}\.(?:jpe?g|png|webp|gif)$/i.test(featuredImagePath)) {
    return { fieldErrors: { featuredImagePath: ["Upload the featured image through Eraasim."] } };
  }

  const scheduledFor = parsed.data.intent === "scheduled" ? parseKolkataDateTime(parsed.data.scheduledLocal) : null;
  if (parsed.data.intent === "scheduled" && (!scheduledFor || scheduledFor <= new Date())) {
    return { fieldErrors: { scheduledLocal: ["Choose a future date and time in Asia/Kolkata."] } };
  }

  const { session } = await requireRouteAccess("/blog/new");
  const now = new Date();

  try {
    await db.transaction(async (tx) => {
      if (parsed.data.categoryId) {
        const [category] = await tx.select({ id: categories.id }).from(categories).where(eq(categories.id, parsed.data.categoryId)).limit(1);
        if (!category) throw new Error("The selected category is no longer available.");
      }

      const [post] = await tx.insert(posts).values({
        title: parsed.data.title,
        slug,
        shortDescription: parsed.data.shortDescription,
        content,
        featuredImagePath,
        categoryId: parsed.data.categoryId || null,
        status: parsed.data.intent,
        scheduledFor,
        publishedAt: parsed.data.intent === "published" ? now : null,
        unpublishedAt: parsed.data.intent === "unpublished" ? now : null,
        seoTitle: optionalText(parsed.data.seoTitle),
        seoDescription: optionalText(parsed.data.seoDescription),
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
    const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";
    if (code === "23505") return { fieldErrors: { slug: ["This slug is already in use. Choose another."] } };
    return { error: error instanceof Error ? error.message : "The post could not be created." };
  }

  redirect("/blog?created=1");
}
