import { PostListPage } from "@/components/post-list-page";
import { canUsePermission, requireRouteAccess } from "@/src/auth/authorization";
import { getPostList, parsePage } from "@/src/blog/post-list";

export default async function DraftPostsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { authorization } = await requireRouteAccess("/blog/drafts");
  const { page } = await searchParams;
  const result = await getPostList("draft", parsePage(page));

  return (
    <PostListPage
      title="Draft Posts"
      description="Posts still being prepared. Deleted drafts are excluded."
      emptyMessage="There are no draft posts."
      basePath="/blog/drafts"
      canEdit={canUsePermission(authorization, "blog.posts.edit")}
      {...result}
    />
  );
}
