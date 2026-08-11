import { PostListPage } from "@/components/post-list-page";
import { softDeletePost } from "@/app/(admin)/blog/actions";
import { canUsePermission, requireRouteAccess } from "@/src/auth/authorization";
import { getPostList, parsePage } from "@/src/blog/post-list";

export default async function AllPostsPage({ searchParams }: { searchParams: Promise<{ created?: string; lifecycle?: string; page?: string }> }) {
  const { authorization } = await requireRouteAccess("/blog");
  const { created, lifecycle, page } = await searchParams;
  const result = await getPostList("all", parsePage(page));

  return (
    <PostListPage
      title="All Posts"
      description="Every active post across the publishing workflow. Deleted posts are excluded."
      emptyMessage="There are no active posts yet."
      basePath="/blog"
      created={created === "1"}
      canEdit={canUsePermission(authorization, "blog.posts.edit")}
      canDelete={canUsePermission(authorization, "blog.posts.delete")}
      softDeleteAction={softDeletePost}
      lifecycle={lifecycle}
      {...result}
    />
  );
}
