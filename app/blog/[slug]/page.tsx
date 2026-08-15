import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { BlogComments } from "@/components/blog-comments";
import { TiptapContent } from "@/components/tiptap-content";
import { getApprovedCommentCount, getCommentsSettings, getPublicComments } from "@/src/comments";
import { publicMediaUrl } from "@/src/media";
import { getPublicArticle, incrementPublicArticleView } from "@/src/public-blog";

export const dynamic = "force-dynamic";
const formatter = new Intl.DateTimeFormat("en-IN", { dateStyle: "long", timeZone: "Asia/Kolkata" });
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const post = await getPublicArticle((await params).slug);
  if (!post) return {};
  return { title: post.seoTitle || post.title, description: post.seoDescription || post.shortDescription, alternates: { canonical: `/blog/${post.slug}` } };
}
export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const post = await getPublicArticle((await params).slug);
  if (!post) notFound();
  const userAgent = (await headers()).get("user-agent") ?? "";
  if (!/bot|crawler|spider|slurp|preview/i.test(userAgent)) await incrementPublicArticleView(post.id);
  const image = publicMediaUrl(post.featuredImagePath);
  const settings = post.commentsEnabled ? await getCommentsSettings() : null;
  const comments = settings?.enabled ? await Promise.all([getPublicComments(post.id, settings.initialCount), getApprovedCommentCount(post.id)]) : null;
  return <article className="article"><header className="article-header">{post.categoryName && post.categorySlug ? <Link className="category-chip" href={`/categories/${post.categorySlug}`}>{post.categoryName}</Link> : null}<h1>{post.title}</h1><p className="article-summary">{post.shortDescription}</p><div className="post-meta article-byline"><span>By <strong>{post.authorName}</strong></span><span aria-hidden="true">·</span><time dateTime={post.publishedAt.toISOString()}>{formatter.format(post.publishedAt)}</time></div></header>{image ? <figure className="featured-figure"><Image className="article-featured" src={image} alt="" width={1200} height={675} priority unoptimized /></figure> : null}<TiptapContent content={post.content} />{comments ? <BlogComments postId={post.id} initial={comments[0].items} count={comments[1]} hasMore={comments[0].hasMore} nextCursor={comments[0].nextCursor} /> : null}</article>;
}
