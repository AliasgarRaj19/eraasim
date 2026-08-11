import { and, eq, isNull, ne } from "drizzle-orm";
import { posts } from "@/src/db/schema";

export function editablePostPredicate(postId: string) {
  return and(eq(posts.id, postId), isNull(posts.deletedAt));
}

export function competingSlugPredicate(postId: string, slug: string) {
  return and(eq(posts.slug, slug), ne(posts.id, postId));
}
