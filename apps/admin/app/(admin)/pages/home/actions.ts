"use server";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requirePermission } from "@/src/auth/authorization";
import { db } from "@/src/db";
import { activityLogs, homePageConfigurations } from "@/src/db/schema";
import { defaultHomeConfig, parseHomeForm } from "@/src/home-page/config";
export type HomeFormState = { error?: string; fieldErrors?: Record<string, string[]> };
const identity = z.object({ expectedVersion: z.coerce.number().int().min(0), intent: z.enum(["draft", "publish"]) });
export async function saveHomePage(_state: HomeFormState, formData: FormData): Promise<HomeFormState> {
  const id = identity.safeParse(Object.fromEntries(formData));
  if (!id.success) return { error: "This Home Page request is invalid." };
  const permission = id.data.intent === "publish" ? "pages.home.publish" : "pages.home.edit";
  const { session } = await requirePermission(permission);
  const config = parseHomeForm(formData);
  if (!config.success) return { error: "Review the Home Page fields.", fieldErrors: config.error.flatten().fieldErrors as Record<string, string[]> };
  const result = await db.transaction(async (tx) => {
    const [current] = await tx.select().from(homePageConfigurations).where(eq(homePageConfigurations.id, "home")).limit(1).for("update");
    const currentVersion = current?.draftVersion ?? 0;
    if (currentVersion !== id.data.expectedVersion) return "stale";
    const now = new Date(); const nextVersion = currentVersion + 1;
    if (current) await tx.update(homePageConfigurations).set({ draft: config.data, published: id.data.intent === "publish" ? config.data : current.published, draftVersion: nextVersion, publishedAt: id.data.intent === "publish" ? now : current.publishedAt, publishedById: id.data.intent === "publish" ? session.user.id : current.publishedById, updatedAt: now }).where(eq(homePageConfigurations.id, "home"));
    else await tx.insert(homePageConfigurations).values({ id: "home", draft: config.data ?? defaultHomeConfig, published: id.data.intent === "publish" ? config.data : null, draftVersion: nextVersion, publishedAt: id.data.intent === "publish" ? now : null, publishedById: id.data.intent === "publish" ? session.user.id : null });
    await tx.insert(activityLogs).values({ staffAccountId: session.user.id, action: id.data.intent === "publish" ? "page.home.published" : "page.home.draft_saved", entityType: "page", entityId: "home", description: id.data.intent === "publish" ? "Home Page changes published." : "Home Page draft saved.", metadata: { page: "home", draftVersion: nextVersion, publishedAt: id.data.intent === "publish" ? now.toISOString() : undefined } });
    return id.data.intent;
  });
  redirect(`/pages/home?result=${result}`);
}
