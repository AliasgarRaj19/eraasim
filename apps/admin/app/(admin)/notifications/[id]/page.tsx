import Link from "next/link";
import { and, eq, inArray } from "drizzle-orm";
import { notFound } from "next/navigation";
import { z } from "zod";
import { resolveNotification } from "@/app/(admin)/notifications/actions";
import { canUsePermission, requirePermission } from "@/src/auth/authorization";
import { db } from "@/src/db";
import { activityLogs, adminNotifications } from "@/src/db/schema";
import { markNotificationRead, visibleNotificationModules } from "@/src/notifications/service";

const format = new Intl.DateTimeFormat("en-IN", { dateStyle: "full", timeStyle: "long", timeZone: "Asia/Kolkata" });
export default async function Page({params}:{params:Promise<{id:string}>}){const{id}=await params;if(!z.uuid().safeParse(id).success)notFound();const{session,authorization}=await requirePermission("notifications.view"),modules=visibleNotificationModules(authorization);if(!modules.length)notFound();const[row]=await db.select().from(adminNotifications).where(and(eq(adminNotifications.id,id),inArray(adminNotifications.module,modules))).limit(1);if(!row)notFound();if(row.status==="unread"){const changed=await markNotificationRead(row.id,session.user.id);if(changed)await db.insert(activityLogs).values({staffAccountId:session.user.id,action:"notification.read",entityType:"admin_notification",entityId:row.id,description:"Operational notification read."});row.status="read";row.readAt=changed?.at??row.readAt}return <article className="notification-detail"><Link href="/notifications">← All Notifications</Link><div className="page-heading"><p className="page-eyebrow">Operational Notification</p><h1>{row.title}</h1></div><dl><dt>Timestamp</dt><dd>{format.format(row.createdAt)}</dd><dt>Severity</dt><dd>{row.severity}</dd><dt>Module</dt><dd>{row.module}</dd><dt>Type</dt><dd>{row.type}</dd><dt>Message</dt><dd>{row.message}</dd><dt>Target</dt><dd>{row.targetUrl?<Link href={row.targetUrl}>Open related record</Link>:"—"}</dd><dt>Status</dt><dd>{row.status}</dd><dt>Read</dt><dd>{row.readAt?format.format(row.readAt):"—"}</dd><dt>Resolved</dt><dd>{row.resolvedAt?format.format(row.resolvedAt):"—"}</dd></dl>{canUsePermission(authorization,"notifications.manage")&&row.status!=="resolved"?<form action={resolveNotification}><input type="hidden" name="notificationId" value={row.id}/><button className="primary-action">Resolve</button></form>:null}</article>}
