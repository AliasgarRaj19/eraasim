import type { Metadata } from "next";
import { PostGrid } from "@/components/post-grid";
import { getPublicCategories, getPublicPosts, parsePublicPage } from "@/src/public-blog";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Blog | Eraasim", description: "Published stories of culture, food and places from Eraasim." };
export default async function BlogPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const [{ page }, categories] = await Promise.all([searchParams, getPublicCategories()]);
  const result = await getPublicPosts(parsePublicPage(page));
  return <section className="content-section"><header className="page-hero"><p className="eyebrow">Eraasim Blog</p><h1>Stories</h1><p>Culture, food and placesâ€”published thoughtfully.</p></header>{categories.length ? <nav className="category-nav" aria-label="Browse by category">{categories.map((category) => <Link key={category.slug} href={`/categories/${category.slug}`}>{category.name}</Link>)}</nav> : null}<PostGrid {...result} /></section>;
}
