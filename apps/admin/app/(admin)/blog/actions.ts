"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdministrativeAccount, requirePermission } from "@/src/auth/authorization";
import { canPermanentlyDeletePost, resolvePostDeletionMutation } from "@/src/blog/post-deletion";
import { db } from "@/src/db";
import { activityLogs, posts } from "@/src/db/schema";

const postIdentitySchema = z.object({ postId: z.uuid() });

function postIdFrom(formData: FormData) {
  const parsed = postIdentitySchema.safeParse(Object.fromEntries(formData));
  return parsed.success ? parsed.data.postId : null;
}

type LifecycleResult = "success" | "stale" | "not-found";

async function mutateDeletedAt(postId: string, actorId: string, action: "soft-delete" | "restore"): Promise<LifecycleResult> {
  return db.transaction(async (tx) => {
    const [post] = await tx.select({
      id: posts.id,
      slug: posts.slug,
      status: posts.status,
      deletedAt: posts.deletedAt,
    }).from(posts).where(eq(posts.id, postId)).limit(1).for("update");
    if (!post) return "not-found";

    const mutation = resolvePostDeletionMutation(action, post.deletedAt, new Date());
    if (mutation.kind !== "update") return "stale";
    await tx.update(posts).set(mutation.values).where(eq(posts.id, post.id));

    const restoring = action === "restore";
    await tx.insert(activityLogs).values({
      staffAccountId: actorId,
      action: restoring ? "blog.post.restored" : "blog.post.deleted",
      entityType: "post",
      entityId: post.id,
      description: restoring ? "Blog post restored." : "Blog post moved to Deleted Posts.",
      metadata: { postId: post.id, slug: post.slug, status: post.status, context: restoring ? "restored" : "soft-deleted" },
    });
    return "success";
  });
}

export async function softDeletePost(formData: FormData) {
  const postId = postIdFrom(formData);
  if (!postId) redirect("/blog?lifecycle=invalid");
  const { session } = await requirePermission("blog.posts.delete");
  const result = await mutateDeletedAt(postId, session.user.id, "soft-delete");
  redirect(`/blog?lifecycle=${result === "success" ? "deleted" : result}`);
}

export async function restorePost(formData: FormData) {
  const postId = postIdFrom(formData);
  if (!postId) redirect("/blog/deleted?lifecycle=invalid");
  const { session } = await requirePermission("blog.posts.restore");
  const result = await mutateDeletedAt(postId, session.user.id, "restore");
  redirect(`/blog/deleted?lifecycle=${result === "success" ? "restored" : result}`);
}

export async function permanentlyDeletePost(formData: FormData) {
  const postId = postIdFrom(formData);
  if (!postId) redirect("/blog/deleted?lifecycle=invalid");
  const { session, authorization } = await requireAdministrativeAccount();
  if (!canPermanentlyDeletePost(authorization)) redirect("/dashboard?access=denied");

  const result = await db.transaction(async (tx): Promise<LifecycleResult> => {
    const [post] = await tx.select({
      id: posts.id,
      slug: posts.slug,
      status: posts.status,
      deletedAt: posts.deletedAt,
    }).from(posts).where(eq(posts.id, postId)).limit(1).for("update");
    if (!post) return "not-found";
    if (resolvePostDeletionMutation("permanent-delete", post.deletedAt, new Date()).kind !== "delete") return "stale";

    // This log intentionally has no post foreign key, so it survives the row deletion.
    await tx.insert(activityLogs).values({
      staffAccountId: session.user.id,
      action: "blog.post.permanently_deleted",
      entityType: "post",
      entityId: post.id,
      description: "Soft-deleted blog post permanently removed.",
      metadata: { postId: post.id, slug: post.slug, status: post.status, context: "permanent-delete" },
    });
    await tx.delete(posts).where(eq(posts.id, post.id));
    return "success";
  });

  redirect(`/blog/deleted?lifecycle=${result === "success" ? "permanently-deleted" : result}`);
}
