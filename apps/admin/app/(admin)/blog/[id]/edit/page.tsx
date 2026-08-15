import { asc, eq, sql } from "drizzle-orm";
import { notFound } from "next/navigation";
import { z } from "zod";
import { requestManualSubscriberSend, updatePost } from "@/app/(admin)/blog/[id]/edit/actions";
import { SubscriberSendForm } from "@/components/subscriber-send-form";
import { PostForm } from "@/app/(admin)/blog/new/new-post-form";
import { requirePermission } from "@/src/auth/authorization";
import { editablePostPredicate } from "@/src/blog/post-edit";
import { formatKolkataDateTime } from "@/src/blog/publishing";
import { db } from "@/src/db";
import { categories, posts, subscriberNotificationJobs } from "@/src/db/schema";
import { hierarchicalCategoryOptions } from "@/src/categories/category";

export default async function EditPostPage({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ updated?: string }>;
}) {
  await requirePermission("blog.posts.edit");
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();

  const [[post], availableCategories, query, notification] = await Promise.all([
    db.select({
      id: posts.id,
      title: posts.title,
      slug: posts.slug,
      shortDescription: posts.shortDescription,
      featuredImagePath: posts.featuredImagePath,
      categoryId: posts.categoryId,
      content: posts.content,
      seoTitle: posts.seoTitle,
      seoDescription: posts.seoDescription,
      scheduledFor: posts.scheduledFor,
      status: posts.status,
      commentsEnabled: posts.commentsEnabled,
      likesEnabled: posts.likesEnabled,
      sharingEnabled: posts.sharingEnabled,
      updatedAt: posts.updatedAt,
    }).from(posts).where(editablePostPredicate(id)).limit(1),
    db.select({ id: categories.id, name: categories.name, parentId: categories.parentId }).from(categories).orderBy(asc(categories.name)),
    searchParams,
    db.select({automaticSentAt:sql<Date|null>`max(${subscriberNotificationJobs.completedAt}) filter(where ${subscriberNotificationJobs.type}='automatic' and ${subscriberNotificationJobs.status}='completed')`,manualSentAt:sql<Date|null>`max(${subscriberNotificationJobs.completedAt}) filter(where ${subscriberNotificationJobs.type}='manual' and ${subscriberNotificationJobs.status}='completed')`,manualCount:sql<number>`count(*) filter(where ${subscriberNotificationJobs.type}='manual')::int`,pending:sql<number>`count(*) filter(where ${subscriberNotificationJobs.status} in ('pending','processing'))::int`}).from(subscriberNotificationJobs).where(eq(subscriberNotificationJobs.postId,id)),
  ]);
  if (!post) notFound();

  return <>
    <PostForm
      categories={hierarchicalCategoryOptions(availableCategories)}
      action={updatePost}
      mode="edit"
      updated={query.updated === "1"}
      hiddenFields={{ postId: post.id, expectedUpdatedAt: post.updatedAt.toISOString() }}
      initialValues={{
        title: post.title,
        slug: post.slug,
        shortDescription: post.shortDescription,
        featuredImagePath: post.featuredImagePath ?? "",
        categoryId: post.categoryId ?? "",
        content: post.content,
        seoTitle: post.seoTitle ?? "",
        seoDescription: post.seoDescription ?? "",
        scheduledLocal: formatKolkataDateTime(post.scheduledFor),
        status: post.status,
        commentsEnabled: post.commentsEnabled,
        likesEnabled: post.likesEnabled,
        sharingEnabled: post.sharingEnabled,
      }}
    />
    {post.status==="published"?<section className="form-section"><h2>Subscriber Notifications</h2><p>Automatic: {notification[0]?.automaticSentAt?`Sent ${notification[0].automaticSentAt.toISOString()}`:notification[0]?.pending?"Pending":"Not sent"}</p><p>Manual: {notification[0]?.manualSentAt?`Last sent ${notification[0].manualSentAt.toISOString()}`:"Not sent"} · {notification[0]?.manualCount??0} request(s)</p><SubscriberSendForm postId={post.id} previouslySent={(notification[0]?.manualCount??0)>0} action={requestManualSubscriberSend}/></section>:null}
  </>;
}
