import { eq } from "drizzle-orm";
import { ThemeForm } from "@/components/theme-form";
import { canUsePermission, requireRouteAccess } from "@/src/auth/authorization";
import { db } from "@/src/db";
import { themeConfigurations } from "@/src/db/schema";
import { defaultThemeConfig, parseThemeConfig } from "@/src/theme/config";

export default async function ThemePage({ searchParams }: { searchParams: Promise<{ result?: string }> }) {
  const { authorization } = await requireRouteAccess("/theme");
  const [[row], query] = await Promise.all([db.select({ draft: themeConfigurations.draft, draftVersion: themeConfigurations.draftVersion }).from(themeConfigurations).where(eq(themeConfigurations.id, "theme")).limit(1), searchParams]);
  const parsed = parseThemeConfig(row?.draft);
  return <ThemeForm config={parsed.success ? parsed.data : defaultThemeConfig} version={row?.draftVersion ?? 0} canEdit={canUsePermission(authorization, "theme.edit")} canPublish={canUsePermission(authorization, "theme.publish")} result={query.result} />;
}
