import { and, asc, eq, ilike, sql } from "drizzle-orm";
import Link from "next/link";
import { resubscribeSubscriber, unsubscribeSubscriber } from "@/app/(admin)/subscribers/actions";
import { requirePermission } from "@/src/auth/authorization";
import { db } from "@/src/db";
import { subscribers } from "@/src/db/schema";

const dateTime = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" });

export default async function Page({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; page?: string }> }) {
  await requirePermission("subscribers.view");
  const params = await searchParams, page = Math.max(1, Number(params.page) || 1);
  const status = ["active", "unsubscribed"].includes(params.status ?? "") ? params.status as "active" | "unsubscribed" : undefined;
  const query = (params.q ?? "").trim().slice(0, 254);
  const where = and(status ? eq(subscribers.status, status) : undefined, query ? ilike(subscribers.normalizedEmail, `%${query.replace(/[%_]/g, "\\$&")}%`) : undefined);
  const [rows, total] = await Promise.all([db.select().from(subscribers).where(where).orderBy(asc(subscribers.normalizedEmail)).limit(50).offset((page - 1) * 50), db.select({ n: sql<number>`count(*)::int` }).from(subscribers).where(where)]);
  const pages = Math.max(1, Math.ceil((total[0]?.n ?? 0) / 50));
  const pageHref = (next: number) => { const value = new URLSearchParams(); if (query) value.set("q", query); if (status) value.set("status", status); value.set("page", String(next)); return `?${value}`; };
  return <section className="subscribers-list"><div className="page-heading"><p className="page-eyebrow">Subscribers</p><h1>All Subscribers</h1></div>
    <div className="list-toolbar"><form><label>Search<input name="q" type="search" placeholder="Search by email" defaultValue={query} /></label><label>Status<select name="status" defaultValue={status ?? "all"}><option value="all">All</option><option value="active">Active</option><option value="unsubscribed">Unsubscribed</option></select></label><button>Filter</button></form><Link className="subscriber-export" href="/api/subscribers/export">Export CSV</Link></div>
    {rows.length ? <div className="subscribers-table-wrap"><table className="subscribers-table"><thead><tr><th>Email</th><th>Status</th><th>Source</th><th>Subscribed</th><th>Unsubscribed</th><th>Last notification</th><th>Actions</th></tr></thead><tbody>{rows.map((subscriber) => <tr key={subscriber.id}><td className="subscriber-email">{subscriber.email}</td><td><span className={`subscriber-status subscriber-status-${subscriber.status}`}>{subscriber.status === "active" ? "Active" : "Unsubscribed"}</span></td><td className="subscriber-source">{subscriber.source}</td><td><time dateTime={subscriber.subscribedAt.toISOString()}>{dateTime.format(subscriber.subscribedAt)}</time></td><td>{subscriber.unsubscribedAt ? <time dateTime={subscriber.unsubscribedAt.toISOString()}>{dateTime.format(subscriber.unsubscribedAt)}</time> : "—"}</td><td>{subscriber.lastNotificationAt ? <time dateTime={subscriber.lastNotificationAt.toISOString()}>{dateTime.format(subscriber.lastNotificationAt)}</time> : "—"}</td><td className="subscriber-actions"><form action={subscriber.status === "active" ? unsubscribeSubscriber : resubscribeSubscriber}><input type="hidden" name="subscriberId" value={subscriber.id} /><button>{subscriber.status === "active" ? "Unsubscribe" : "Re-subscribe"}</button></form></td></tr>)}</tbody></table></div> : <div className="post-list-empty"><h2>No subscribers found</h2><p>Try changing the search or status filter.</p></div>}
    <nav className="pagination" aria-label="Subscriber pagination"><p>{total[0]?.n ?? 0} subscribers</p><div>{page > 1 ? <Link href={pageHref(page - 1)}>Previous</Link> : <span aria-disabled="true">Previous</span>}<span>Page {page} of {pages}</span>{page < pages ? <Link href={pageHref(page + 1)}>Next</Link> : <span aria-disabled="true">Next</span>}</div></nav>
  </section>;
}
