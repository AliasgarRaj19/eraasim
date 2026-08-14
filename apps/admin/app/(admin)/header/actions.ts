"use server";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requirePermission } from "@/src/auth/authorization";
import { db } from "@/src/db";
import { activityLogs, headerConfigurations } from "@/src/db/schema";
import { defaultHeaderConfig, parseHeaderForm } from "@/src/header/config";
import { pageReferencesAreEligible } from "@/src/generic-pages/eligible";
export type HeaderFormState = { error?: string };
const identity = z.object({ expectedVersion: z.coerce.number().int().min(0), intent: z.enum(["draft", "publish"]) });
export async function saveHeader(_state: HeaderFormState, formData: FormData): Promise<HeaderFormState> {
  const id = identity.safeParse(Object.fromEntries(formData));
  if (!id.success) return { error: "This Header request is invalid." };
  const { session } = await requirePermission(id.data.intent === "publish" ? "header.publish" : "header.edit");
  const parsed = parseHeaderForm(formData); if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Review the Header fields." };
  if (!await pageReferencesAreEligible(parsed.data.manualItems.map(item => item.pageId))) return { error: "One or more selected Pages are not publicly eligible." };
  const result = await db.transaction(async (tx) => {
    const [current] = await tx.select().from(headerConfigurations).where(eq(headerConfigurations.id, "header")).limit(1).for("update");
    const version = current?.draftVersion ?? 0; if (version !== id.data.expectedVersion) return "stale";
    const next = version + 1; const now = new Date();
    if (current) await tx.update(headerConfigurations).set({ draft: parsed.data, published: id.data.intent === "publish" ? parsed.data : current.published, draftVersion: next, publishedAt: id.data.intent === "publish" ? now : current.publishedAt, publishedById: id.data.intent === "publish" ? session.user.id : current.publishedById, updatedAt: now }).where(eq(headerConfigurations.id, "header"));
    else await tx.insert(headerConfigurations).values({ id: "header", draft: parsed.data ?? defaultHeaderConfig, published: id.data.intent === "publish" ? parsed.data : null, draftVersion: next, publishedAt: id.data.intent === "publish" ? now : null, publishedById: id.data.intent === "publish" ? session.user.id : null });
    await tx.insert(activityLogs).values({ staffAccountId: session.user.id, action: id.data.intent === "publish" ? "header.published" : "header.draft_saved", entityType: "header", entityId: "header", description: id.data.intent === "publish" ? "Header changes published." : "Header draft saved.", metadata: { headerId: "header", draftVersion: next, publishedAt: id.data.intent === "publish" ? now.toISOString() : undefined } });
    return id.data.intent;
  });
  if (result === "stale") return { error: "This Header Draft changed after you opened it. Reload before saving." };
  redirect(`/header?result=${result}`);
}
