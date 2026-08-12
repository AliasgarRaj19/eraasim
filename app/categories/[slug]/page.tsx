import { notFound } from "next/navigation";
import Link from "next/link";
import { PostGrid } from "@/components/post-grid";
import { getPublicCategories, getPublicPosts, parsePublicPage } from "@/src/public-blog";

export const dynamic = "force-dynamic";
export default async function CategoryPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ page?: string }> }) {
  const [{ slug }, { page }, categories] = await Promise.all([params, searchParams, getPublicCategories()]);
  const category = categories.find((candidate) => candidate.slug === slug);
  if (!category) notFound();
  const result = await getPublicPosts(parsePublicPage(page), slug);
  return <section className="content-section listing-page"><header className="page-hero category-page-hero"><p className="eyebrow">{category.parentName ? "Child category" : "Parent category"}</p><h1>{category.name}</h1>{category.parentName ? <p className="category-parent-note">Within <span>{category.parentName}</span></p> : null}<p>{category.description || "Published stories assigned directly to this category."}</p><Link className="text-link" href="/blog">â† Back to all stories</Link></header><PostGrid {...result} basePath={`/categories/${slug}`} /></section>;
}
