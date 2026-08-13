"use server";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requirePermission } from "@/src/auth/authorization";
import { db } from "@/src/db";
import { activityLogs, themeConfigurations } from "@/src/db/schema";
import { defaultThemeConfig, parseThemeForm } from "@/src/theme/config";

export type ThemeState = { error?: string };
const identity = z.object({ expectedVersion: z.coerce.number().int().min(0), intent: z.enum(["draft", "publish", "reset"]) });

export async function saveTheme(_state: ThemeState, formData: FormData): Promise<ThemeState> {
  const request = identity.safeParse(Object.fromEntries(formData));
  if (!request.success) return { error: "This Theme request is invalid." };
  const permission = request.data.intent === "publish" ? "theme.publish" : "theme.edit";
  const { session } = await requirePermission(permission);
  const parsed = request.data.intent === "reset" ? { success: true as const, data: defaultThemeConfig } : parseThemeForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Review the Theme fields." };
  const outcome = await db.transaction(async (tx) => {
    const [current] = await tx.select().from(themeConfigurations).where(eq(themeConfigurations.id, "theme")).limit(1).for("update");
    const version = current?.draftVersion ?? 0;
    if (version !== request.data.expectedVersion) return "stale" as const;
    const next = version + 1;
    const now = new Date();
    const publish = request.data.intent === "publish";
    if (current) await tx.update(themeConfigurations).set({ draft: parsed.data, published: publish ? parsed.data : current.published, draftVersion: next, publishedAt: publish ? now : current.publishedAt, publishedById: publish ? session.user.id : current.publishedById, updatedAt: now }).where(eq(themeConfigurations.id, "theme"));
    else await tx.insert(themeConfigurations).values({ id: "theme", draft: parsed.data, published: publish ? parsed.data : null, draftVersion: next, publishedAt: publish ? now : null, publishedById: publish ? session.user.id : null });
    const action = request.data.intent === "reset" ? "theme.reset_to_default" : publish ? "theme.published" : "theme.draft_saved";
    await tx.insert(activityLogs).values({ staffAccountId: session.user.id, action, entityType: "theme", entityId: "theme", description: request.data.intent === "reset" ? "Theme Draft reset to Eraasim defaults." : publish ? "Theme changes published." : "Theme Draft saved.", metadata: { themeId: "theme", draftVersion: next, publishedAt: publish ? now.toISOString() : undefined, reset: request.data.intent === "reset" || undefined } });
    return request.data.intent;
  });
  if (outcome === "stale") return { error: "This Theme Draft changed after you opened it. Reload before saving." };
  redirect(`/theme?result=${outcome}`);
}
