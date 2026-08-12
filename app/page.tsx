import Link from "next/link";
import { PostGrid } from "@/components/post-grid";
import { getLatestPosts } from "@/src/public-blog";

export const dynamic = "force-dynamic";
export default async function Home() {
  const posts = await getLatestPosts(6);
  return <><section className="hero"><p className="eyebrow">Culture Â· Food Â· Places</p><h1>Stories rooted in people and place.</h1><p>Explore thoughtful articles from Eraasim.</p><Link className="primary-link" href="/blog">Explore the Blog</Link></section><section className="content-section" aria-labelledby="latest-heading"><div className="section-title"><div><p className="eyebrow">From the Blog</p><h2 id="latest-heading">Latest Posts</h2></div><Link href="/blog">View all stories</Link></div><PostGrid items={posts} /></section></>;
}
