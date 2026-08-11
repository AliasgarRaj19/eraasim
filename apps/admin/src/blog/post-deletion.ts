import { and, eq, isNotNull, isNull } from "drizzle-orm";
import type { AdminAuthorization } from "@/src/auth/authorization";
import { posts } from "@/src/db/schema";

export type PostDeletionAction = "soft-delete" | "restore" | "permanent-delete";

export function activePostPredicate(postId: string) {
  return and(eq(posts.id, postId), isNull(posts.deletedAt));
}

export function deletedPostPredicate(postId: string) {
  return and(eq(posts.id, postId), isNotNull(posts.deletedAt));
}

export function resolvePostDeletionMutation(action: PostDeletionAction, deletedAt: Date | null, now: Date) {
  if (action === "soft-delete") return deletedAt ? { kind: "stale" as const } : { kind: "update" as const, values: { deletedAt: now } };
  if (action === "restore") return deletedAt ? { kind: "update" as const, values: { deletedAt: null } } : { kind: "stale" as const };
  return deletedAt ? { kind: "delete" as const } : { kind: "stale" as const };
}

export function canPermanentlyDeletePost(authorization: AdminAuthorization) {
  return authorization.isMasterAdmin;
}
