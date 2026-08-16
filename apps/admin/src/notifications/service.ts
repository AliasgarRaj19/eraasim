import { and, eq } from "drizzle-orm";
import { db } from "@/src/db";
import { adminNotifications } from "@/src/db/schema";
import type { AdminAuthorization } from "@/src/auth/authorization";

export const notificationModules = ["contact", "comments", "subscribers", "staff", "blog", "system"] as const;
export type NotificationModule = typeof notificationModules[number];
export const notificationTypes = ["contact_email_failed", "comment_reply_email_failed", "subscriber_job_failed", "subscriber_worker_failed", "staff_invitation_email_failed", "password_reset_email_failed", "scheduled_publishing_failed"] as const;
export type NotificationType = typeof notificationTypes[number];
export type NotificationSeverity = "info" | "warning" | "error";

export const modulePermission: Record<Exclude<NotificationModule, "system">, string> = {
  contact: "contact.messages.view",
  comments: "comments.view",
  subscribers: "subscribers.view",
  staff: "staff.view",
  blog: "blog.posts.view",
};

export function visibleNotificationModules(authorization: AdminAuthorization): NotificationModule[] {
  if (authorization.isMasterAdmin) return [...notificationModules];
  return (Object.entries(modulePermission) as Array<[Exclude<NotificationModule, "system">, string]>).filter(([, permission]) => authorization.permissionKeys.has(permission)).map(([module]) => module);
}

type NotificationInput = {
  type: NotificationType;
  module: NotificationModule;
  title: string;
  message: string;
  targetType?: string;
  targetId?: string;
  targetUrl?: string;
  severity?: NotificationSeverity;
  dedupeKey?: string;
};

const safeText = (value: string, maximum: number) => value.replace(/\b(?:smtp_app_password|password|api[_-]?key|subscriber_token_secret|reset_token|invite_token)\s*[:=]\s*\S+/gi, "[redacted]").replace(/[\u0000-\u001f\u007f]+/g, " ").replace(/\s+/g, " ").trim().slice(0, maximum);
const safeTargetUrl = (value?: string) => value && /^\/(?!\/)[a-z0-9/_?=&.-]{1,299}$/i.test(value) ? value : undefined;
const safeTargetType = (value?: string) => value && /^[a-z_]{1,40}$/.test(value) ? value : undefined;
const safeUuid = (value?: string) => value && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value) ? value : undefined;

export function notificationValues(input: NotificationInput) {
  const targetId = safeUuid(input.targetId), targetType = safeTargetType(input.targetType), targetUrl = safeTargetUrl(input.targetUrl);
  const title = safeText(input.title, 160), message = safeText(input.message, 500);
  if (!title || !message) throw new Error("Operational notification content is required.");
  const dedupeKey = safeText(input.dedupeKey ?? [input.type, targetType ?? "none", targetId ?? "none"].join(":"), 240);
  return { type: input.type, module: input.module, title, message, targetType, targetId, targetUrl, severity: input.severity ?? "warning" as NotificationSeverity, dedupeKey };
}

export async function createOperationalNotification(input: NotificationInput) {
  try { await db.insert(adminNotifications).values(notificationValues(input)).onConflictDoNothing(); return true; } catch { console.error("Operational notification could not be recorded."); return false; }
}
export async function tryCreateOperationalNotification(input: NotificationInput) { return createOperationalNotification(input); }

export async function markNotificationRead(id: string, staffAccountId: string) {
  const now = new Date();
  const [changed] = await db.update(adminNotifications).set({ status: "read", readAt: now }).where(and(eq(adminNotifications.id, id), eq(adminNotifications.status, "unread"))).returning({ id: adminNotifications.id });
  return changed ? { id: changed.id, staffAccountId, at: now } : null;
}

export type SqlNotificationClient = { query(text: string, values?: unknown[]): Promise<unknown> };
export async function createOperationalNotificationSql(client: SqlNotificationClient, input: NotificationInput) {
  const value = notificationValues(input);
  try { await client.query(`INSERT INTO admin_notifications(type,module,title,message,target_type,target_id,target_url,severity,dedupe_key)
    VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT DO NOTHING`, [value.type, value.module, value.title, value.message, value.targetType ?? null, value.targetId ?? null, value.targetUrl ?? null, value.severity, value.dedupeKey]); return true; } catch { console.error("Operational notification could not be recorded."); return false; }
}
