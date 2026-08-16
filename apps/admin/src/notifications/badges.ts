import { sql } from "drizzle-orm";
import { db } from "@/src/db";
import type { AdminAuthorization } from "@/src/auth/authorization";
import { canUsePermission } from "@/src/auth/authorization";
import { modulePermission, type NotificationModule } from "@/src/notifications/service";

export type AdminBadgeCounts = { contactMessages: number; pendingComments: number; newSubscribers: number; unreadNotifications: number };
const zero: AdminBadgeCounts = { contactMessages: 0, pendingComments: 0, newSubscribers: 0, unreadNotifications: 0 };

export async function getAdminBadgeCounts(authorization: AdminAuthorization): Promise<AdminBadgeCounts> {
  const contact = canUsePermission(authorization, "contact.messages.view"), comments = canUsePermission(authorization, "comments.view"), subscribers = canUsePermission(authorization, "subscribers.view"), notifications = canUsePermission(authorization, "notifications.view");
  const modules = authorization.isMasterAdmin ? ["contact", "comments", "subscribers", "staff", "blog", "system"] : (Object.entries(modulePermission) as Array<[Exclude<NotificationModule, "system">, string]>).filter(([, permission]) => authorization.permissionKeys.has(permission)).map(([module]) => module);
  if (!contact && !comments && !subscribers && (!notifications || !modules.length)) return zero;
  const moduleList = modules.length ? sql.join(modules.map((module) => sql`${module}`), sql`,`) : sql`NULL`;
  const result = await db.execute<{ contact_messages: number; pending_comments: number; new_subscribers: number; unread_notifications: number }>(sql`
    SELECT
      ${contact ? sql`(SELECT count(*)::int FROM contact_messages WHERE status='new')` : sql`0`} AS contact_messages,
      ${comments ? sql`(SELECT count(*)::int FROM blog_comments WHERE status='pending' AND deleted_at IS NULL)` : sql`0`} AS pending_comments,
      ${subscribers ? sql`(SELECT count(*)::int FROM subscribers WHERE status='active' AND admin_seen_at IS NULL)` : sql`0`} AS new_subscribers,
      ${notifications && modules.length ? sql`(SELECT count(*)::int FROM admin_notifications WHERE status='unread' AND module IN (${moduleList}))` : sql`0`} AS unread_notifications
  `);
  const row = result.rows[0];
  return { contactMessages: Number(row?.contact_messages ?? 0), pendingComments: Number(row?.pending_comments ?? 0), newSubscribers: Number(row?.new_subscribers ?? 0), unreadNotifications: Number(row?.unread_notifications ?? 0) };
}
