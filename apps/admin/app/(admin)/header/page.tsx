import { eq } from "drizzle-orm";
import { HeaderForm } from "@/components/header-form";
import { canUsePermission, requireRouteAccess } from "@/src/auth/authorization";
import { db } from "@/src/db";
import { headerConfigurations } from "@/src/db/schema";
import { defaultHeaderConfig, parseHeaderConfig } from "@/src/header/config";
export default async function HeaderPage({ searchParams }: { searchParams: Promise<{ result?: string }> }) { const { authorization } = await requireRouteAccess("/header"); const [[row], query] = await Promise.all([db.select({ draft: headerConfigurations.draft, draftVersion: headerConfigurations.draftVersion }).from(headerConfigurations).where(eq(headerConfigurations.id, "header")).limit(1), searchParams]); const parsed = parseHeaderConfig(row?.draft); return <HeaderForm config={parsed.success ? parsed.data : defaultHeaderConfig} version={row?.draftVersion ?? 0} canEdit={canUsePermission(authorization, "header.edit")} canPublish={canUsePermission(authorization, "header.publish")} result={query.result} />; }
