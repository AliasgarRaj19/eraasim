import { and, count, desc, eq, isNotNull, isNull } from "drizzle-orm";
import { db } from "@/src/db";
import { categories, posts, staffAccounts } from "@/src/db/schema";

export const POSTS_PER_PAGE = 20;
export type PostListFilter = "all" | "draft" | "deleted";

export function postListPredicate(filter: PostListFilter) {
  const notDeleted = isNull(posts.deletedAt);
  if (filter === "deleted") return isNotNull(posts.deletedAt);
  return filter === "draft" ? and(eq(posts.status, "draft"), notDeleted) : notDeleted;
}

export function parsePage(value: string | undefined) {
  const page = Number(value);
  return Number.isSafeInteger(page) && page > 0 ? page : 1;
}

export async function getPostList(filter: PostListFilter, requestedPage: number) {
  const where = postListPredicate(filter);
  const [{ total }] = await db.select({ total: count() }).from(posts).where(where);
  const totalPages = Math.max(1, Math.ceil(total / POSTS_PER_PAGE));
  const page = Math.min(Math.max(requestedPage, 1), totalPages);

  const items = await db.select({
    id: posts.id,
    title: posts.title,
    categoryName: categories.name,
    status: posts.status,
    authorName: staffAccounts.name,
    authorEmail: staffAccounts.email,
    createdAt: posts.createdAt,
    updatedAt: posts.updatedAt,
    publishedAt: posts.publishedAt,
    scheduledFor: posts.scheduledFor,
    deletedAt: posts.deletedAt,
  })
    .from(posts)
    .leftJoin(categories, eq(posts.categoryId, categories.id))
    .innerJoin(staffAccounts, eq(posts.createdById, staffAccounts.id))
    .where(where)
    .orderBy(desc(posts.createdAt), desc(posts.id))
    .limit(POSTS_PER_PAGE)
    .offset((page - 1) * POSTS_PER_PAGE);

  return { items, page, total, totalPages };
}

export type PostListItem = Awaited<ReturnType<typeof getPostList>>["items"][number];
