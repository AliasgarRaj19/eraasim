import Link from "next/link";
import { PostCard } from "@/components/post-card";
import { PUBLIC_POSTS_PER_PAGE, type PublicPostCard } from "@/src/public-blog";

export function PostGrid({ items, page, total, totalPages, basePath = "/blog" }: { items: PublicPostCard[]; page?: number; total?: number; totalPages?: number; basePath?: string }) {
  if (!items.length) return <div className="public-empty"><p className="eyebrow">The journal is quiet</p><h2>No published stories yet</h2><p>New stories will appear here after they are published.</p></div>;
  return <><div className="post-grid">{items.map((post) => <PostCard key={post.slug} post={post} />)}</div>{page && total !== undefined && totalPages ? <nav className="public-pagination" aria-label="Blog pagination"><span>Showing {(page - 1) * PUBLIC_POSTS_PER_PAGE + 1}â€“{Math.min(page * PUBLIC_POSTS_PER_PAGE, total)} of {total}</span><div>{page > 1 ? <Link href={page === 2 ? basePath : `${basePath}?page=${page - 1}`}>Previous</Link> : <span aria-disabled="true">Previous</span>}<span>Page {page} of {totalPages}</span>{page < totalPages ? <Link href={`${basePath}?page=${page + 1}`}>Next</Link> : <span aria-disabled="true">Next</span>}</div></nav> : null}</>;
}
