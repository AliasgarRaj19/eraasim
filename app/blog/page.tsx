import type { Metadata } from "next";
import Link from "next/link";
import { PostGrid } from "@/components/post-grid";
import { getPublicCategories, getPublicPosts, parsePublicPage } from "@/src/public-blog";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Blog | Eraasim", description: "Published stories of culture, food and places from Eraasim." };
export default async function BlogPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const [{ page }, categories] = await Promise.all([searchParams, getPublicCategories()]);
  const result = await getPublicPosts(parsePublicPage(page));
  return <section className="content-section listing-page"><header className="page-hero"><p className="eyebrow">The Eraasim journal</p><h1>Stories</h1><p>Thoughtful notes on culture, food, places and the experiences that connect them.</p></header>{categories.length ? <nav className="category-nav" aria-label="Browse by category"><span>Browse:</span>{categories.map((category) => <Link key={category.slug} href={`/categories/${category.slug}`}>{category.name}</Link>)}</nav> : null}<PostGrid {...result} /></section>;
}
