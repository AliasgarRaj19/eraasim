import Link from "next/link";
import { count, desc } from "drizzle-orm";
import { requireRouteAccess } from "@/src/auth/authorization";
import { db } from "@/src/db";
import { contactMessages } from "@/src/db/schema";

const pageSize = 20;
const formatDate = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" });

export default async function ContactMessagesPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  await requireRouteAccess("/contact-messages");
  const query = await searchParams;
  const page = Math.max(1, Number.parseInt(query.page ?? "1", 10) || 1);
  const [[total], rows] = await Promise.all([
    db.select({ value: count() }).from(contactMessages),
    db.select().from(contactMessages).orderBy(desc(contactMessages.submittedAt), desc(contactMessages.id)).limit(pageSize).offset((page - 1) * pageSize),
  ]);
  const pageCount = Math.max(1, Math.ceil(total.value / pageSize));
  return <section className="contact-inbox">
    <div className="page-heading"><p className="page-eyebrow">Inbox</p><h1>Contact Messages</h1><p>Stored enquiries, newest first. Email is a notification only.</p></div>
    {rows.length ? <>
      <div className="contact-inbox-table-wrap">
        <table className="contact-inbox-table">
          <thead><tr><th>Name</th><th>Email</th><th>Subject</th><th>Submitted</th><th>Status</th><th>Notification</th><th><span className="visually-hidden">Action</span></th></tr></thead>
          <tbody>{rows.map((row) => <tr key={row.id}>
            <td className="contact-cell-name">{row.name}</td>
            <td className="contact-cell-email">{row.email}</td>
            <td className="contact-cell-subject" title={row.subject}>{row.subject}</td>
            <td className="contact-cell-submitted"><time dateTime={row.submittedAt.toISOString()}>{formatDate.format(row.submittedAt)}</time></td>
            <td><span className={`contact-badge contact-badge-${row.status}`}>{row.status}</span></td>
            <td><span className={`contact-badge ${row.notificationSent ? "contact-badge-sent" : "contact-badge-unsent"}`}>{row.notificationSent ? "Sent" : "Not sent"}</span></td>
            <td className="contact-cell-action"><Link className="contact-view-action" href={`/contact-messages/${row.id}`}>View<span className="visually-hidden"> message from {row.name}</span></Link></td>
          </tr>)}</tbody>
        </table>
      </div>
      <nav className="pagination" aria-label="Contact messages pages">{page > 1 ? <Link href={`/contact-messages?page=${page - 1}`}>Previous</Link> : <span />}<span>Page {page} of {pageCount}</span>{page < pageCount ? <Link href={`/contact-messages?page=${page + 1}`}>Next</Link> : <span />}</nav>
    </> : <div className="empty-state"><h2>No contact messages</h2><p>New enquiries will appear here after they are securely stored.</p></div>}
  </section>;
}
