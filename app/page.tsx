import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { PostGrid } from "@/components/post-grid";
import { getPublishedHomeConfig, type HomeConfig } from "@/src/home-page";
import { availablePublicMediaUrl } from "@/src/media";
import { getLatestPosts, getPublicCategories } from "@/src/public-blog";
export const dynamic = "force-dynamic";
export async function generateMetadata(): Promise<Metadata> { const config = await getPublishedHomeConfig(); return { title: config.seoTitle || "Eraasim", description: config.seoDescription || "Stories of culture, food and places." }; }
export default async function Home() {
  const config = await getPublishedHomeConfig();
  const [backgroundImage, profileImage] = await Promise.all([
    config.hero.showBackgroundImage ? availablePublicMediaUrl(config.hero.backgroundImagePath) : null,
    config.hero.showProfileImage ? availablePublicMediaUrl(config.hero.profileImagePath) : null,
  ]);
  const heroStyle = { "--hero-eyebrow-size": `${config.hero.eyebrowSize}px`, "--hero-heading-size": `${config.hero.headingSize}px`, "--hero-description-size": `${config.hero.descriptionSize}px`, ...(backgroundImage ? { "--hero-background-image": `url(\"${backgroundImage}\")` } : {}) } as CSSProperties;
  const [posts, categories] = await Promise.all([config.latestStories.visible ? getLatestPosts(config.latestStories.postCount) : [], config.categoryDiscovery.visible ? getPublicCategories() : []]);
  const parents = categories.filter((category) => category.parentId === null); const children = categories.filter((category) => category.parentId !== null);
  const sections: Record<HomeConfig["sectionOrder"][number], React.ReactNode> = {
    hero: config.hero.visible ? <section className={`hero${backgroundImage ? " hero-with-background" : ""}`} style={heroStyle} key="hero"><div className="hero-copy">{config.hero.showEyebrow ? <p className="eyebrow">{config.hero.eyebrow}</p> : null}{config.hero.showHeading ? <h1>{config.hero.heading}</h1> : null}{config.hero.showDescription ? <p>{config.hero.description}</p> : null}{config.hero.showCta && config.hero.ctaLabel ? <Link className="primary-link" href={config.hero.ctaDestination}>{config.hero.ctaLabel} <span aria-hidden="true">→</span></Link> : null}</div>{profileImage ? <div className="hero-mark"><Image src={profileImage} alt="" width={800} height={800} sizes="(max-width: 640px) 0px, (max-width: 900px) 30vw, 40vw" unoptimized /></div> : config.useLegacyHeroMark ? <div className="hero-mark" aria-hidden="true"><span>E</span></div> : null}</section> : null,
    latestStories: config.latestStories.visible ? <section className="content-section latest-section" aria-labelledby="latest-heading" key="latestStories"><div className="section-title"><div><p className="eyebrow">From the journal</p><h2 id="latest-heading">{config.latestStories.heading}</h2><p>{config.latestStories.description}</p></div><Link className="text-link" href="/blog">View all stories <span aria-hidden="true">→</span></Link></div><PostGrid items={posts} /></section> : null,
    categoryDiscovery: config.categoryDiscovery.visible && parents.length ? <section id="categories" className="category-discovery" aria-labelledby="categories-heading" key="categoryDiscovery"><div className="category-discovery-inner"><div className="section-title"><div><p className="eyebrow">Find your way</p><h2 id="categories-heading">{config.categoryDiscovery.heading}</h2><p>{config.categoryDiscovery.description}</p></div></div><div className="category-family-grid">{parents.map((parent) => <article className="category-family" key={parent.id}><Link href={`/categories/${parent.slug}`}><span>Parent category</span><h3>{parent.name}</h3>{parent.description ? <p>{parent.description}</p> : null}</Link>{children.some((child) => child.parentId === parent.id) ? <nav aria-label={`${parent.name} child categories`}>{children.filter((child) => child.parentId === parent.id).map((child) => <Link key={child.id} href={`/categories/${child.slug}`}>{child.name}<span aria-hidden="true">↗</span></Link>)}</nav> : null}</article>)}</div></div></section> : null,
  };
  return <>{config.sectionOrder.map((id) => sections[id])}</>;
}
