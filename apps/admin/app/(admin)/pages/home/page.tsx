import { eq } from "drizzle-orm";
import { HomePageForm } from "@/components/home-page-form";
import { canUsePermission, requireRouteAccess } from "@/src/auth/authorization";
import { db } from "@/src/db";
import { homePageConfigurations } from "@/src/db/schema";
import { defaultHomeConfig, homeConfigSchema } from "@/src/home-page/config";
export default async function HomePageAdmin({ searchParams }: { searchParams: Promise<{ result?: string }> }) {
  const { authorization } = await requireRouteAccess("/pages/home");
  const [[row], query] = await Promise.all([db.select({ draft: homePageConfigurations.draft, draftVersion: homePageConfigurations.draftVersion }).from(homePageConfigurations).where(eq(homePageConfigurations.id, "home")).limit(1), searchParams]);
  const parsed = homeConfigSchema.safeParse(row?.draft);
  return <HomePageForm config={parsed.success ? parsed.data : defaultHomeConfig} version={row?.draftVersion ?? 0} canEdit={canUsePermission(authorization, "pages.home.edit")} canPublish={canUsePermission(authorization, "pages.home.publish")} result={query.result} />;
}
