import { permanentlyDeletePost, restorePost } from "@/app/(admin)/blog/actions";
import { PostListPage } from "@/components/post-list-page";
import { canUsePermission, requireRouteAccess } from "@/src/auth/authorization";
import { canPermanentlyDeletePost } from "@/src/blog/post-deletion";
import { getPostList, parsePage } from "@/src/blog/post-list";

export default async function DeletedPostsPage({ searchParams }: { searchParams: Promise<{ lifecycle?: string; page?: string }> }) {
  const { authorization } = await requireRouteAccess("/blog/deleted");
  const { lifecycle, page } = await searchParams;
  const result = await getPostList("deleted", parsePage(page));

  return (
    <PostListPage
      title="Deleted Posts"
      description="Soft-deleted posts can be restored without changing their previous publishing state."
      emptyMessage="There are no deleted posts."
      basePath="/blog/deleted"
      deletedView
      lifecycle={lifecycle}
      canRestore={canUsePermission(authorization, "blog.posts.restore")}
      canPermanentlyDelete={canPermanentlyDeletePost(authorization)}
      restoreAction={restorePost}
      permanentDeleteAction={permanentlyDeletePost}
      {...result}
    />
  );
}
