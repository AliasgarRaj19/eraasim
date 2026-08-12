import { notFound } from "next/navigation";
import { PostGrid } from "@/components/post-grid";
import { getPublicCategories, getPublicPosts, parsePublicPage } from "@/src/public-blog";

export const dynamic = "force-dynamic";
export default async function CategoryPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ page?: string }> }) {
  const [{ slug }, { page }, categories] = await Promise.all([params, searchParams, getPublicCategories()]);
  const category = categories.find((candidate) => candidate.slug === slug);
  if (!category) notFound();
  const result = await getPublicPosts(parsePublicPage(page), slug);
  return <section className="content-section"><header className="page-hero"><p className="eyebrow">Category</p><h1>{category.name}</h1><p>Published stories assigned directly to this category.</p></header><PostGrid {...result} basePath={`/categories/${slug}`} /></section>;
}
