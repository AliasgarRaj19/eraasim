"use server";
import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requirePermission } from "@/src/auth/authorization";
import { db } from "@/src/db";
import { activityLogs, subscribers } from "@/src/db/schema";

async function changeSubscriberStatus(formData: FormData, next: "active" | "unsubscribed") {
  const parsed = z.uuid().safeParse(formData.get("subscriberId"));
  if (!parsed.success) throw new Error("Invalid subscriber.");
  const { session } = await requirePermission("subscribers.settings"), now = new Date();
  await db.transaction(async (tx) => {
    const [changed] = await tx.update(subscribers).set({ status: next, unsubscribedAt: next === "active" ? null : now, adminSeenAt: next === "active" ? null : undefined, updatedAt: now }).where(and(eq(subscribers.id, parsed.data), eq(subscribers.status, next === "active" ? "unsubscribed" : "active"))).returning({ id: subscribers.id });
    if (!changed) return;
    await tx.insert(activityLogs).values({ staffAccountId: session.user.id, action: next === "active" ? "subscriber.resubscribed" : "subscriber.manually_unsubscribed", entityType: "subscriber", entityId: parsed.data, description: next === "active" ? "Subscriber manually re-subscribed." : "Subscriber manually unsubscribed.", metadata: { subscriberId: parsed.data, status: next } });
  });
  revalidatePath("/subscribers");
}
export async function unsubscribeSubscriber(formData: FormData) { await changeSubscriberStatus(formData, "unsubscribed"); }
export async function resubscribeSubscriber(formData: FormData) { await changeSubscriberStatus(formData, "active"); }
export async function markNewSubscribersSeen() { const {session}=await requirePermission("subscribers.view"),now=new Date();const changed=await db.update(subscribers).set({adminSeenAt:now}).where(and(eq(subscribers.status,"active"),sql`${subscribers.adminSeenAt} IS NULL`)).returning({id:subscribers.id});if(changed.length)await db.insert(activityLogs).values({staffAccountId:session.user.id,action:"subscribers.acknowledged",entityType:"subscribers",description:"New subscriber attention items marked seen.",metadata:{count:changed.length}});revalidatePath("/subscribers"); }
