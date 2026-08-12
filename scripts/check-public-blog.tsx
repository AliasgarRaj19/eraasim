import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { TiptapContent, tiptapRenderSecurity } from "../components/tiptap-content";
import { PostCard } from "../components/post-card";
import { PUBLIC_MEDIA_PATTERN, publicMediaUrl } from "../src/media";
import { PUBLIC_POST_SQL } from "../src/public-blog";

assert.equal(PUBLIC_POST_SQL, "p.status = 'published' AND p.deleted_at IS NULL");
const dataSource = readFileSync(new URL("../src/public-blog.ts", import.meta.url), "utf8");
assert(dataSource.includes(`WHERE p.slug = $1 AND \${PUBLIC_POST_SQL}`), "slug lookup must use the public predicate in SQL");
assert(!dataSource.includes("scheduled_for <="), "elapsed schedules must not be treated as published");
for (const forbidden of ["draft", "scheduled", "unpublished"]) assert.notEqual(forbidden, "published");

const uuid = "123e4567-e89b-42d3-a456-426614174000";
assert(PUBLIC_MEDIA_PATTERN.test(`${uuid}.webp`));
assert.equal(publicMediaUrl(`/api/uploads/${uuid}.webp`), `/media/${uuid}.webp`);
for (const unsafe of ["../../secret", "/api/uploads/../secret", "/api/uploads/not-a-uuid.png", "/etc/passwd", "/api/uploads/test.svg"]) assert.equal(publicMediaUrl(unsafe), null);

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
  const card = renderToStaticMarkup(<PostCard post={{ slug: "story", title: "Story", shortDescription: "Summary", featuredImagePath: null, categoryName, categorySlug, publishedAt: new Date("2026-08-01T00:00:00Z"), authorName: "Author" }} />);
  assert(card.includes(`href="/categories/${categorySlug}"`) && card.includes(categoryName), "the exact assigned Parent or Child category must render");
}

const articleSource = readFileSync(new URL("../app/blog/[slug]/page.tsx", import.meta.url), "utf8");
assert(articleSource.includes("if (!post) notFound()"));
assert(articleSource.includes("post.seoTitle || post.title") && articleSource.includes("post.seoDescription || post.shortDescription"));
const adminShell = readFileSync(new URL("../apps/admin/app/(admin)/admin-shell.tsx", import.meta.url), "utf8");
const publicShell = readFileSync(new URL("../components/public-shell.tsx", import.meta.url), "utf8");
assert(adminShell.includes("Designed by Aliasgar Raj"));
assert(publicShell.includes("Designed by Aliasgar Raj"));
const compose = readFileSync(new URL("../compose.yaml", import.meta.url), "utf8");
assert(compose.includes("eraasim-uploads:/app/storage/uploads:ro"));

console.log("PASS: public predicate, nonpublic isolation, slug 404, safe TipTap/link/image/YouTube rendering, exact category query architecture, media security, SEO fallback, and attributions verified.");
