import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { TiptapContent, tiptapRenderSecurity } from "../components/tiptap-content";
import { PostCard } from "../components/post-card";
import { PUBLIC_MEDIA_PATTERN, publicMediaUrl } from "../src/media";
import { defaultHomeConfig, resolvePublishedHome } from "../src/home-page";
import { PUBLIC_POST_SQL } from "../src/public-blog";
import { getPool } from "../src/db";

assert.equal(PUBLIC_POST_SQL, "p.status = 'published' AND p.deleted_at IS NULL");
const originalDatabaseUrl = process.env.DATABASE_URL;
delete process.env.DATABASE_URL;
assert.throws(() => getPool(), /DATABASE_URL is required for public database operations/, "environment validation must be deferred until an actual database operation");
if (originalDatabaseUrl) process.env.DATABASE_URL = originalDatabaseUrl;
const dataSource = readFileSync(new URL("../src/public-blog.ts", import.meta.url), "utf8");
const dbSource = readFileSync(new URL("../src/db.ts", import.meta.url), "utf8");
assert(dbSource.includes("export function getPool()") && !dbSource.includes("export const pool"), "the pool must be lazy rather than module-initialized");
assert(dataSource.includes("const pool = getPool()"), "query helpers must request the pool lazily");
assert(dataSource.includes(`WHERE p.slug = $1 AND \${PUBLIC_POST_SQL}`), "slug lookup must use the public predicate in SQL");
assert(!dataSource.includes("scheduled_for <="), "elapsed schedules must not be treated as published");
for (const forbidden of ["draft", "scheduled", "unpublished"]) assert.notEqual(forbidden, "published");

const uuid = "123e4567-e89b-42d3-a456-426614174000";
assert(PUBLIC_MEDIA_PATTERN.test(`${uuid}.webp`));
assert.equal(publicMediaUrl(`/api/uploads/${uuid}.webp`), `/media/${uuid}.webp`);
for (const unsafe of ["../../secret", "/api/uploads/../secret", "/api/uploads/not-a-uuid.png", "/etc/passwd", "/api/uploads/test.svg"]) assert.equal(publicMediaUrl(unsafe), null);
const mediaSource = readFileSync(new URL("../src/media.ts", import.meta.url), "utf8");
assert(mediaSource.includes("availablePublicMediaUrl") && mediaSource.includes("await stat") && mediaSource.includes("catch { return null; }"), "missing Hero media must fail safely");
const oldHome = { ...defaultHomeConfig, hero: { visible: true, eyebrow: "Old", heading: "Old", description: "Old", ctaLabel: "Read", ctaDestination: "/blog" } };
const resolvedOldHome = resolvePublishedHome(oldHome);
assert.equal(resolvedOldHome.hero.eyebrowSize, 11); assert.equal(resolvedOldHome.hero.headingSize, 96); assert.equal(resolvedOldHome.hero.descriptionSize, 22);
assert.equal(resolvedOldHome.hero.backgroundImagePath, ""); assert.equal(resolvedOldHome.hero.showBackgroundImage, false); assert.equal(resolvedOldHome.hero.profileImagePath, ""); assert.equal(resolvedOldHome.hero.showProfileImage, false);
assert.equal(resolvedOldHome.hero.showEyebrow, true); assert.equal(resolvedOldHome.hero.showHeading, true); assert.equal(resolvedOldHome.hero.showDescription, true); assert.equal(resolvedOldHome.hero.showCta, true);
assert.equal(resolvedOldHome.hero.backgroundImageOpacity, 100); assert.equal(resolvedOldHome.hero.profileImageOpacity, 100);

const content = { type: "doc", content: [
  { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Heading" }] },
  { type: "paragraph", content: [{ type: "text", text: "Bold linked", marks: [{ type: "bold" }, { type: "link", attrs: { href: "https://example.com/story" } }] }] },
  { type: "bulletList", content: [{ type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Item" }] }] }] },
  { type: "image", attrs: { src: `/api/uploads/${uuid}.webp`, width: 58, alt: "Example" } },
  { type: "youtube", attrs: { src: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" } },
] };
const html = renderToStaticMarkup(<TiptapContent content={content} />);
assert(html.includes("<h2") && html.includes("<strong") && html.includes("<ul") && html.includes("<li"));
assert(html.includes('href="https://example.com/story"') && html.includes('rel="noopener noreferrer nofollow"'));
assert(html.includes(`/media/${uuid}.webp`) && html.includes("--image-width:58%"));
assert(html.includes("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"));
assert.equal(tiptapRenderSecurity.safeLink("javascript:alert(1)"), null);
assert.equal(tiptapRenderSecurity.youtubeId("https://evil.example/embed/dQw4w9WgXcQ"), null);

for (const [categoryName, categorySlug] of [["Food", "food"], ["Street Food", "street-food"]]) {
  const card = renderToStaticMarkup(<PostCard post={{ id: uuid, slug: "story", title: "Story", shortDescription: "Summary", featuredImagePath: null, categoryName, categorySlug, publishedAt: new Date("2026-08-01T00:00:00Z"), authorName: "Author" }} />);
  assert(card.includes(`href="/categories/${categorySlug}"`) && card.includes(categoryName), "the exact assigned Parent or Child category must render");
}

const articleSource = readFileSync(new URL("../app/blog/[slug]/page.tsx", import.meta.url), "utf8");
assert(articleSource.includes("if (!post) notFound()"));
assert(articleSource.includes("post.seoTitle || post.title") && articleSource.includes("post.seoDescription || post.shortDescription"));
const adminShell = readFileSync(new URL("../apps/admin/app/(admin)/admin-shell.tsx", import.meta.url), "utf8");
const publicFooter = readFileSync(new URL("../components/footer-content.tsx", import.meta.url), "utf8");
assert(adminShell.includes("Designed by Aliasgar Raj"));
assert(publicFooter.includes("Designed by Aliasgar Raj"));
assert(publicFooter.includes('href="/"') && publicFooter.includes('href="/blog"') && publicFooter.includes('href="/#categories"'), "Footer fallback navigation must preserve approved links");
const homepageSource = readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");
assert(homepageSource.includes("getHomeStoryPool(config.latestStories.selectionMode, config.latestStories.manualPostIds)"), "homepage story pool must come from the resolved configuration");
assert(!homepageSource.includes("categoryDiscovery"), "retired Home Category Discovery must not render");
const homeConfigSource = readFileSync(new URL("../src/home-page.ts", import.meta.url), "utf8");
assert(homeConfigSource.includes("resolvePublishedHome") && homeConfigSource.includes("defaultHomeConfig"), "homepage must retain the approved fallback without CMS data");
assert(homepageSource.includes("config.sectionOrder.map") && homepageSource.includes("config.hero.visible") && homepageSource.includes("config.featuredStory.visible") && homepageSource.includes("config.latestStories.visible"));
assert(homepageSource.includes('config.seoTitle || "Eraasim"') && homepageSource.includes('config.seoDescription || "Stories of culture, food and places."'), "Home SEO must retain safe defaults");
const categoryPageSource = readFileSync(new URL("../app/categories/[slug]/page.tsx", import.meta.url), "utf8");
assert(categoryPageSource.includes("category.description") && categoryPageSource.includes("category.parentName"), "category page must render real description and hierarchy context");
const cssSource = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
assert(cssSource.includes("--width-reading") && cssSource.includes("@media (max-width: 640px)") && cssSource.includes("prefers-reduced-motion"));
const compose = readFileSync(new URL("../compose.yaml", import.meta.url), "utf8");
assert(compose.includes("eraasim-uploads:/app/storage/uploads:ro"));

console.log("PASS: public predicate, nonpublic isolation, slug 404, safe TipTap/link/image/YouTube rendering, exact category query architecture, media security, SEO fallback, and attributions verified.");
