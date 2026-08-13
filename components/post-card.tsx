import Image from "next/image";
import Link from "next/link";
import type { PublicPostCard } from "@/src/public-blog";
import { publicMediaUrl } from "@/src/media-url";
import { firstYouTubeId } from "@/src/featured-story";

const formatter = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeZone: "Asia/Kolkata" });
export function PostCard({ post }: { post: PublicPostCard }) {
  const image = publicMediaUrl(post.featuredImagePath);
  const youtubeId = post.content ? firstYouTubeId(post.content) : null;
  const media = youtubeId
    ? <div className="post-card-image post-card-video"><iframe src={`https://www.youtube-nocookie.com/embed/${youtubeId}`} title={`Video: ${post.title}`} allow="accelerometer; encrypted-media; gyroscope; picture-in-picture" allowFullScreen /></div>
    : <Link className="post-card-image" href={`/blog/${post.slug}`} tabIndex={-1} aria-hidden="true">{image ? <Image src={image} alt="" width={720} height={405} unoptimized /> : <span className="image-fallback">Eraasim</span>}</Link>;
  return <article className={`post-card${youtubeId || image ? "" : " post-card-no-image"}`}>{media}<div className="post-card-copy">{post.categoryName && post.categorySlug ? <Link className="category-chip" href={`/categories/${post.categorySlug}`}>{post.categoryName}</Link> : <span className="category-chip category-unassigned">Journal</span>}<h2><Link href={`/blog/${post.slug}`}>{post.title}</Link></h2><p>{post.shortDescription}</p><div className="post-meta"><span>By {post.authorName}</span><time dateTime={post.publishedAt.toISOString()}>{formatter.format(post.publishedAt)}</time></div></div></article>;
}
