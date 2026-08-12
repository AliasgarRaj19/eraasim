import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TiptapContent } from "@/components/tiptap-content";
import { publicMediaUrl } from "@/src/media";
import { getPublicArticle } from "@/src/public-blog";

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
  const image = publicMediaUrl(post.featuredImagePath);
  return <article className="article"><header className="article-header">{post.categoryName && post.categorySlug ? <Link className="category-chip" href={`/categories/${post.categorySlug}`}>{post.categoryName}</Link> : null}<h1>{post.title}</h1><p className="article-summary">{post.shortDescription}</p><div className="post-meta article-byline"><span>By <strong>{post.authorName}</strong></span><span aria-hidden="true">Â·</span><time dateTime={post.publishedAt.toISOString()}>{formatter.format(post.publishedAt)}</time></div></header>{image ? <figure className="featured-figure"><Image className="article-featured" src={image} alt="" width={1200} height={675} priority unoptimized /></figure> : null}<TiptapContent content={post.content} /><div className="future-discussion-slot" aria-hidden="true"><span /></div></article>;
}
