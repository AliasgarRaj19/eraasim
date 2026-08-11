import Link from "next/link";
import { ConfirmPostAction } from "@/components/confirm-post-action";
import { POSTS_PER_PAGE, type PostListItem } from "@/src/blog/post-list";

type PostListPageProps = {
  title: string;
  description: string;
  emptyMessage: string;
  basePath: string;
  items: PostListItem[];
  page: number;
  total: number;
  totalPages: number;
  created?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  canRestore?: boolean;
  canPermanentlyDelete?: boolean;
  deletedView?: boolean;
  lifecycle?: string;
  softDeleteAction?: (formData: FormData) => void | Promise<void>;
  restoreAction?: (formData: FormData) => void | Promise<void>;
  permanentDeleteAction?: (formData: FormData) => void | Promise<void>;
};

const dateFormatter = new Intl.DateTimeFormat("en-IN", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Kolkata",
});

function formatDate(value: Date | null) {
  return value ? dateFormatter.format(value) : "—";
}

function publicationDate(post: PostListItem) {
  if (post.status === "published" && post.publishedAt) return `Published ${formatDate(post.publishedAt)}`;
  if (post.status === "scheduled" && post.scheduledFor) return `Scheduled ${formatDate(post.scheduledFor)}`;
  return "—";
}

function pageHref(basePath: string, page: number) {
  return page === 1 ? basePath : `${basePath}?page=${page}`;
}

const lifecycleMessages: Record<string, string> = {
  deleted: "Post moved to Deleted Posts.",
  restored: "Post restored to its previous publishing state.",
  "permanently-deleted": "Post permanently deleted. Uploaded media was retained.",
  stale: "That action is no longer available because the post state already changed.",
  "not-found": "That post no longer exists.",
  invalid: "The requested post action was invalid.",
};

export function PostListPage({
  title, description, emptyMessage, basePath, items, page, total, totalPages, created, canEdit,
  canDelete, canRestore, canPermanentlyDelete, deletedView, lifecycle,
  softDeleteAction, restoreAction, permanentDeleteAction,
}: PostListPageProps) {
  const showActions = Boolean((canDelete && softDeleteAction) || (deletedView && ((canRestore && restoreAction) || (canPermanentlyDelete && permanentDeleteAction))));
  return (
    <section className="post-list-page" aria-labelledby="post-list-title">
      {created ? <p className="success-message" role="status">Post created successfully.</p> : null}
      {lifecycle && lifecycleMessages[lifecycle] ? <p className={lifecycle === "deleted" || lifecycle === "restored" || lifecycle === "permanently-deleted" ? "success-message" : "form-error"} role="status">{lifecycleMessages[lifecycle]}</p> : null}
      <div className="list-page-header">
        <div>
          <p className="page-eyebrow">Blog</p>
          <h1 id="post-list-title">{title}</h1>
          <p>{description}</p>
        </div>
        <Link className="new-post-link" href="/blog/new">New Post</Link>
      </div>

      {items.length === 0 ? (
        <div className="post-list-empty">
          <h2>No posts found</h2>
          <p>{emptyMessage}</p>
          <Link href="/blog/new">Create a new post</Link>
        </div>
      ) : (
        <>
          <div className="post-table-wrap">
            <table className="post-table">
              <caption className="visually-hidden">{title}</caption>
              <thead><tr><th scope="col">Title</th><th scope="col">Category</th><th scope="col">Status</th><th scope="col">Author</th><th scope="col">Created</th><th scope="col">Updated</th><th scope="col">{deletedView ? "Deleted" : "Published / Scheduled"}</th>{showActions ? <th scope="col">Actions</th> : null}</tr></thead>
              <tbody>
                {items.map((post) => (
                  <tr key={post.id}>
                    <th scope="row">{canEdit ? <Link className="post-title post-edit-link" href={`/blog/${post.id}/edit`}>{post.title}</Link> : <span className="post-title">{post.title}</span>}</th>
                    <td>{post.categoryName ?? "—"}</td>
                    <td><span className={`post-status status-${post.status}`}>{post.status}</span></td>
                    <td><strong>{post.authorName}</strong><small>{post.authorEmail}</small></td>
                    <td><time dateTime={post.createdAt.toISOString()}>{formatDate(post.createdAt)}</time></td>
                    <td><time dateTime={post.updatedAt.toISOString()}>{formatDate(post.updatedAt)}</time></td>
                    <td>{deletedView ? (post.deletedAt ? <time dateTime={post.deletedAt.toISOString()}>{formatDate(post.deletedAt)}</time> : "â€”") : publicationDate(post)}</td>
                    {showActions ? (
                      <td><div className="post-actions">
                        {canDelete && softDeleteAction ? <ConfirmPostAction action={softDeleteAction} postId={post.id} label="Delete" confirmation="Move this post to Deleted Posts? It will disappear from normal Blog lists and can be restored later." /> : null}
                        {deletedView && canRestore && restoreAction ? <ConfirmPostAction action={restoreAction} postId={post.id} label="Restore" confirmation="Restore this post to its previous publishing state?" /> : null}
                        {deletedView && canPermanentlyDelete && permanentDeleteAction ? <ConfirmPostAction action={permanentDeleteAction} postId={post.id} label="Permanent Delete" destructive confirmation="Permanently remove this database post? It cannot be restored, this action cannot be undone, and uploaded media files will be retained." /> : null}
                      </div></td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pagination" aria-label="Post list pagination">
            <p>Showing {(page - 1) * POSTS_PER_PAGE + 1}–{Math.min(page * POSTS_PER_PAGE, total)} of {total}</p>
            <div>
              {page > 1 ? <Link href={pageHref(basePath, page - 1)} rel="prev">Previous</Link> : <span aria-disabled="true">Previous</span>}
              <span>Page {page} of {totalPages}</span>
              {page < totalPages ? <Link href={pageHref(basePath, page + 1)} rel="next">Next</Link> : <span aria-disabled="true">Next</span>}
            </div>
          </div>
        </>
      )}
    </section>
  );
}
