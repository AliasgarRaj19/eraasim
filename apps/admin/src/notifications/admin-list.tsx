import Link from "next/link";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { markAllNotificationsRead, markNotificationReadAction, resolveNotification } from "@/app/(admin)/notifications/actions";
import { canUsePermission, requirePermission } from "@/src/auth/authorization";
import { db } from "@/src/db";
import { adminNotifications } from "@/src/db/schema";
import { visibleNotificationModules } from "@/src/notifications/service";

const format = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" });
export type NotificationFilter = "all" | "unread" | "resolved";

export async function NotificationList({ filter, searchParams }: { filter: NotificationFilter; searchParams: Promise<{ page?: string }> }) {
  const { authorization } = await requirePermission("notifications.view"), modules = visibleNotificationModules(authorization), params = await searchParams, page = Math.max(1, Number(params.page) || 1), size = 25;
  const statusWhere = filter === "unread" ? eq(adminNotifications.status, "unread") : filter === "resolved" ? eq(adminNotifications.status, "resolved") : undefined;
  const where = modules.length ? and(inArray(adminNotifications.module, modules), statusWhere) : sql`false`;
  const [rows, total] = await Promise.all([db.select().from(adminNotifications).where(where).orderBy(desc(adminNotifications.createdAt), desc(adminNotifications.id)).limit(size).offset((page - 1) * size), db.select({ count: sql<number>`count(*)::int` }).from(adminNotifications).where(where)]);
  const pages = Math.max(1, Math.ceil((total[0]?.count ?? 0) / size)), manage = canUsePermission(authorization, "notifications.manage");
  return <section className="notifications-page"><div className="page-heading"><p className="page-eyebrow">Operations</p><h1>{filter === "all" ? "All Notifications" : filter === "unread" ? "Unread Notifications" : "Resolved Notifications"}</h1><p>Actionable delivery and worker failures only. Routine business activity remains in its section.</p></div><nav className="notification-tabs" aria-label="Notification status"><Link href="/notifications">All</Link><Link href="/notifications/unread">Unread</Link><Link href="/notifications/resolved">Resolved</Link></nav>{manage && filter !== "resolved" ? <form action={markAllNotificationsRead}><button type="submit">Mark all unread as read</button></form> : null}
  {rows.length ? <div className="notifications-table-wrap"><table className="notifications-table"><thead><tr><th>Time</th><th>Severity</th><th>Module</th><th>Title</th><th>Status</th><th>Target</th><th>Actions</th></tr></thead><tbody>{rows.map((row)=><tr key={row.id}><td><time dateTime={row.createdAt.toISOString()}>{format.format(row.createdAt)}</time></td><td><span className={`notification-severity notification-severity-${row.severity}`}>{row.severity}</span></td><td>{row.module}</td><td>{row.title}</td><td>{row.status}</td><td>{row.targetUrl?<Link href={row.targetUrl}>Open target</Link>:"—"}</td><td className="table-actions"><Link href={`/notifications/${row.id}`}>View</Link>{manage&&row.status==="unread"?<form action={markNotificationReadAction}><input type="hidden" name="notificationId" value={row.id}/><button>Mark Read</button></form>:null}{manage&&row.status!=="resolved"?<form action={resolveNotification}><input type="hidden" name="notificationId" value={row.id}/><button>Resolve</button></form>:null}</td></tr>)}</tbody></table></div>:<div className="post-list-empty"><h2>No {filter === "all" ? "operational" : filter} notifications</h2><p>There are no accessible issues in this view.</p></div>}
  <nav className="pagination" aria-label="Notification pagination"><p>{total[0]?.count ?? 0} notifications</p><div>{page>1?<Link href={`?page=${page-1}`}>Previous</Link>:<span aria-disabled="true">Previous</span>}<span>Page {page} of {pages}</span>{page<pages?<Link href={`?page=${page+1}`}>Next</Link>:<span aria-disabled="true">Next</span>}</div></nav></section>;
}
