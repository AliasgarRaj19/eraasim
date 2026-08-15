"use server";
import { redirect } from "next/navigation";
import { requirePermission } from "@/src/auth/authorization";
import { db } from "@/src/db";
import { activityLogs, blogEngagementSettings } from "@/src/db/schema";
import { parseEngagementSettingsForm } from "@/src/engagement/config";

export async function saveEngagementSettings(formData: FormData) {
  const parsed = parseEngagementSettingsForm(formData);
  if (!parsed.success) throw new Error("Invalid engagement settings.");
  const { session } = await requirePermission("engagement.settings"), now = new Date();
  await db.transaction(async (tx) => {
    await tx.insert(blogEngagementSettings).values({ id:"global", ...parsed.data, updatedById:session.user.id, updatedAt:now }).onConflictDoUpdate({ target:blogEngagementSettings.id, set:{ ...parsed.data, updatedById:session.user.id, updatedAt:now } });
    await tx.insert(activityLogs).values({ staffAccountId:session.user.id, action:"engagement.settings_updated", entityType:"blog_engagement_settings", entityId:"global", description:"Blog engagement settings updated.", metadata:parsed.data });
  });
  redirect("/engagement?saved=1");
}
