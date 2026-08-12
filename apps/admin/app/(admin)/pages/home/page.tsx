import { and, desc, eq, isNull } from "drizzle-orm";
import { HomePageForm } from "@/components/home-page-form";
import { canUsePermission, requireRouteAccess } from "@/src/auth/authorization";
import { db } from "@/src/db";
import { categories, homePageConfigurations, posts } from "@/src/db/schema";
import { defaultHomeConfig, parseHomeConfig } from "@/src/home-page/config";
export default async function HomePageAdmin({ searchParams }: { searchParams: Promise<{ result?: string }> }) {
  const { authorization } = await requireRouteAccess("/pages/home");
  const [[row], query, postOptions] = await Promise.all([db.select({ draft: homePageConfigurations.draft, draftVersion: homePageConfigurations.draftVersion }).from(homePageConfigurations).where(eq(homePageConfigurations.id, "home")).limit(1), searchParams, db.select({ id: posts.id, title: posts.title, categoryName: categories.name, categoryId: categories.id, categoryParentId: categories.parentId }).from(posts).leftJoin(categories, eq(posts.categoryId, categories.id)).where(and(eq(posts.status, "published"), isNull(posts.deletedAt))).orderBy(desc(posts.publishedAt), desc(posts.id)).limit(200)]);
  const parsed = parseHomeConfig(row?.draft);
  return <HomePageForm config={parsed.success ? parsed.data : defaultHomeConfig} postOptions={postOptions} version={row?.draftVersion ?? 0} canEdit={canUsePermission(authorization, "pages.home.edit")} canPublish={canUsePermission(authorization, "pages.home.publish")} result={query.result} />;
}
